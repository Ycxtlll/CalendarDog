use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    /// "system" | "light" | "dark"
    pub theme: String,
    pub pinned: bool,
    pub autostart: bool,
    pub week_start_monday: bool,
    pub show_almanac: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".into(),
            pinned: false,
            autostart: false,
            week_start_monday: true,
            show_almanac: true,
        }
    }
}

pub fn config_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok()
}

fn settings_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    Some(config_dir(app)?.join("settings.json"))
}

pub fn load(app: &tauri::AppHandle) -> Settings {
    let Some(path) = settings_path(app) else {
        return Settings::default();
    };
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(app: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app).ok_or_else(|| "无法确定配置目录".to_string())?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    // 原子写：先写临时文件再改名，避免写一半留下损坏文件
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn user_holidays_path(app: &tauri::AppHandle, year: u32) -> Option<PathBuf> {
    Some(config_dir(app)?.join(format!("holidays/{year}.json")))
}
