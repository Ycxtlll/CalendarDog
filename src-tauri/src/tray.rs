use std::sync::atomic::Ordering;
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::Datelike;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Monitor};

use crate::date_icon;
use crate::state::AppState;

/// 逻辑窗口尺寸（与 tauri.conf.json 保持一致）
pub const WINDOW_W: f64 = 600.0;
pub const WINDOW_H: f64 = 820.0;

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "open", "打开日历", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let today = chrono::Local::now().day();
    let tray = TrayIconBuilder::with_id("main-tray")
        .icon(date_icon::draw_day(today))
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("CalendarDog")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_or_toggle_at_last(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                position,
                ..
            } = event
            {
                let app = tray.app_handle().clone();
                // 即将发生的 blur 来自托盘点击，抑制延迟隐藏
                suppress_blur(&app);
                toggle_at(&app, position.x, position.y);
            }
        })
        .build(app)?;

    *app.state::<AppState>().tray_icon.lock().unwrap() = Some(tray);
    Ok(())
}

/// 托盘点击抑制：标记接下来 800ms 内的 blur 不触发隐藏
pub fn suppress_blur(app: &AppHandle) {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    app.state::<AppState>()
        .suppress_blur_until_ms
        .store(now_ms + 800, Ordering::Relaxed);
}

pub fn now_suppressed(app: &AppHandle) -> bool {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    now_ms < app.state::<AppState>().suppress_blur_until_ms.load(Ordering::Relaxed)
}

/// 托盘左键：可见则隐藏，否则锚定到点击位置附近显示
fn toggle_at(app: &AppHandle, x: f64, y: f64) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
            return;
        }
    }
    anchor_and_show(app, Some((x, y)));
}

/// 菜单「打开日历」：无点击坐标，在原位置（首次为屏幕右下）显示
fn show_or_toggle_at_last(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
            return;
        }
    }
    anchor_and_show(app, None);
}

/// 首次启动：屏幕右下角显示
pub fn anchor_bottom_right(app: &AppHandle) {
    anchor_and_show(app, None);
}

fn anchor_and_show(app: &AppHandle, cursor: Option<(f64, f64)>) {
    let Some(win) = app.get_webview_window("main") else {
        return;
    };
    let monitor: Monitor = cursor
        .and_then(|(x, y)| app.monitor_from_point(x, y).ok().flatten())
        .or_else(|| app.primary_monitor().ok().flatten())
        .or_else(|| win.current_monitor().ok().flatten())
        .expect("找不到可用显示器");
    let sf = monitor.scale_factor();
    let size = win.outer_size().unwrap_or_else(|_| {
        tauri::PhysicalSize::new((WINDOW_W * sf) as u32, (WINDOW_H * sf) as u32)
    });
    let (w, h) = (size.width as f64, size.height as f64);
    let origin = monitor.position();
    let bounds = monitor.size();

    // 弹窗锚在光标上方偏左（托盘在屏幕右下），并收进屏幕边界内
    let (mut px, mut py) = match cursor {
        Some((cx, cy)) => (cx - w * 0.72, cy - h - 8.0),
        None => (
            origin.x as f64 + bounds.width as f64 - w - 12.0,
            origin.y as f64 + bounds.height as f64 - h - 48.0,
        ),
    };
    px = px.clamp(origin.x as f64 + 4.0, origin.x as f64 + bounds.width as f64 - w - 4.0);
    py = py.clamp(origin.y as f64 + 4.0, origin.y as f64 + bounds.height as f64 - h - 4.0);

    let _ = win.set_position(tauri::PhysicalPosition::new(px as i32, py as i32));
    let _ = win.show();
    let _ = win.set_focus();
    app.state::<AppState>()
        .shown_once
        .store(true, Ordering::Relaxed);
}
