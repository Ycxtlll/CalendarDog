use std::sync::atomic::Ordering;

use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt as _;

use crate::holidays::{self, UpdateSummary, YearHolidays};
use crate::settings::{self, Settings};
use crate::state::AppState;

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Settings {
    app.state::<AppState>().settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn set_settings(app: AppHandle, settings: Settings) -> Result<Settings, String> {
    settings::save(&app, &settings)?;
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.set_always_on_top(settings.pinned);
    }
    {
        let state = app.state::<AppState>();
        state.pinned.store(settings.pinned, Ordering::Relaxed);
        *state.settings.lock().unwrap() = settings.clone();
    }
    apply_autostart(&app, settings.autostart)?;
    Ok(settings)
}

#[tauri::command]
pub fn toggle_pin(app: AppHandle) -> Result<bool, String> {
    let settings = {
        let state = app.state::<AppState>();
        let pinned = !state.pinned.load(Ordering::Relaxed);
        state.pinned.store(pinned, Ordering::Relaxed);
        let mut s = state.settings.lock().unwrap();
        s.pinned = pinned;
        s.clone()
    };
    settings::save(&app, &settings)?;
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.set_always_on_top(settings.pinned);
    }
    Ok(settings.pinned)
}

#[tauri::command]
pub async fn get_year_holidays(app: AppHandle, year: u32) -> Option<YearHolidays> {
    holidays::get_year(&app, year)
}

#[tauri::command]
pub async fn update_holidays(app: AppHandle) -> Result<UpdateSummary, String> {
    Ok(holidays::update(&app).await)
}

fn apply_autostart(app: &AppHandle, enable: bool) -> Result<(), String> {
    let launch = app.autolaunch();
    if enable {
        launch.enable().map_err(|e| e.to_string())
    } else {
        launch.disable().map_err(|e| e.to_string())
    }
}
