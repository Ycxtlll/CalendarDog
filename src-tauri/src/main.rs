#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod date_icon;
mod holidays;
mod settings;
mod state;
mod tray;

use std::sync::atomic::Ordering;
use std::time::Duration;

use chrono::{Datelike, TimeZone};
use tauri::Emitter;
use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

use crate::state::AppState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 第二个实例启动时，唤起已有窗口
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::set_settings,
            commands::toggle_pin,
            commands::get_year_holidays,
            commands::update_holidays,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let s = settings::load(&handle);
            let pinned = s.pinned;
            app.manage(AppState::new(s));

            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_always_on_top(pinned);
            }

            tray::build(&handle)?;

            // 首次启动在右下角展示一次，之后交给托盘
            tray::anchor_bottom_right(&handle);

            spawn_midnight_refresh(handle.clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(false) = event {
                if window.label() != "main" {
                    return;
                }
                let app = window.app_handle().clone();
                let pinned = app
                    .state::<AppState>()
                    .pinned
                    .load(Ordering::Relaxed);
                if pinned {
                    return;
                }
                // 延迟隐藏：给托盘点击事件留出设置抑制标记的时间
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_millis(250));
                    if tray::now_suppressed(&app) {
                        return;
                    }
                    if let Some(win) = app.get_webview_window("main") {
                        let visible = win.is_visible().unwrap_or(false);
                        let focused = win.is_focused().unwrap_or(true);
                        if visible && !focused {
                            let _ = win.hide();
                        }
                    }
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("CalendarDog 启动失败");
}

/// 午夜刷新：重绘托盘狗牌日期，通知前端刷新今天
fn spawn_midnight_refresh(handle: tauri::AppHandle) {
    std::thread::spawn(move || loop {
        let now = chrono::Local::now();
        let tomorrow = now.date_naive() + chrono::Days::new(1);
        let next_midnight = chrono::Local
            .from_local_datetime(&tomorrow.and_hms_opt(0, 0, 0).unwrap())
            .single()
            .unwrap_or(now + chrono::Duration::hours(24));
        let wait = (next_midnight - now)
            .to_std()
            .unwrap_or(Duration::from_secs(60));
        std::thread::sleep(wait + Duration::from_secs(1));

        let day = chrono::Local::now().day();
        let state = handle.state::<AppState>();
        if let Some(tray) = state.tray_icon.lock().unwrap().as_ref() {
            let _ = tray.set_icon(Some(date_icon::draw_day(day)));
            let _ = tray.set_tooltip(Some("CalendarDog"));
        }
        let _ = handle.emit(
            "date-changed",
            chrono::Local::now().format("%Y-%m-%d").to_string(),
        );
    });
}
