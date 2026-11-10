use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use crate::settings;

/// holiday-cn 原始 JSON 结构（NateScarlet/holiday-cn，与国务院通知逐条核对）
#[derive(Debug, Deserialize)]
struct HolidayFile {
    year: u32,
    papers: Option<Vec<String>>,
    days: Vec<HolidayDay>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HolidayDay {
    name: String,
    date: String,
    is_off_day: bool,
}

/// 暴露给前端的一年休班表
#[derive(Debug, Serialize)]
pub struct YearHolidays {
    pub year: u32,
    pub source: Option<String>,
    pub dates: BTreeMap<String, HolidayInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HolidayInfo {
    /// "holiday" = 休 | "workday" = 班
    #[serde(rename = "type")]
    pub kind: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YearStat {
    pub year: u32,
    pub off_days: usize,
    pub work_days: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSummary {
    pub updated: Vec<YearStat>,
    pub failed: Vec<String>,
}

const HOLIDAY_MIRRORS: &[&str] = &[
    "https://raw.githubusercontent.com/NateScarlet/holiday-cn/master",
    "https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master",
];

/// 内置兜底数据（随安装包发布，联网更新后写入配置目录优先生效）
const BUNDLED: &[(&[u8], u32)] = &[
    (include_bytes!("../resources/holidays/2026.json"), 2026),
    (include_bytes!("../resources/holidays/2027.json"), 2027),
];

fn parse_file(bytes: &[u8], expect_year: u32) -> Result<HolidayFile, String> {
    let f: HolidayFile = serde_json::from_slice(bytes).map_err(|e| format!("JSON 解析失败: {e}"))?;
    if f.year != expect_year {
        return Err(format!("年份不匹配: 期望 {expect_year}，实际 {}", f.year));
    }
    if f.days.is_empty() {
        return Err("数据为空".into());
    }
    let prefix = format!("{:04}-", expect_year);
    for d in &f.days {
        if !d.date.starts_with(&prefix) {
            return Err(format!("日期越界: {}", d.date));
        }
    }
    Ok(f)
}

fn to_year_holidays(f: HolidayFile) -> YearHolidays {
    let mut dates = BTreeMap::new();
    for d in f.days {
        dates.insert(
            d.date,
            HolidayInfo {
                kind: if d.is_off_day { "holiday" } else { "workday" }.into(),
                name: d.name,
            },
        );
    }
    YearHolidays {
        year: f.year,
        source: f.papers.and_then(|p| p.first().cloned()),
        dates,
    }
}

/// 查一年数据：用户联网更新过的（配置目录）优先于内置
pub fn get_year(app: &tauri::AppHandle, year: u32) -> Option<YearHolidays> {
    if let Ok(bytes) = fs::read(user_path(app, year)) {
        if let Ok(f) = parse_file(&bytes, year) {
            return Some(to_year_holidays(f));
        }
    }
    BUNDLED
        .iter()
        .find(|(_, y)| *y == year)
        .and_then(|(bytes, y)| parse_file(bytes, *y).ok())
        .map(to_year_holidays)
}

fn user_path(app: &tauri::AppHandle, year: u32) -> PathBuf {
    settings::user_holidays_path(app, year)
        .unwrap_or_else(|| PathBuf::from(format!("holidays/{year}.json")))
}

/// 更新当前年 + 次年：多镜像依次尝试，校验通过后把 holiday-cn 原始 JSON 存进配置目录
pub async fn update(app: &tauri::AppHandle) -> UpdateSummary {
    let current = Local::now().year() as u32;
    let years = [current, current + 1];
    let mut summary = UpdateSummary {
        updated: vec![],
        failed: vec![],
    };

    let client = match reqwest::Client::builder()
        .user_agent("CalendarDog/0.1")
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            summary.failed.push(format!("HTTP 客户端创建失败: {e}"));
            return summary;
        }
    };

    for year in years {
        let mut last_err = String::new();
        for mirror in HOLIDAY_MIRRORS {
            let url = format!("{mirror}/{year}.json");
            let bytes = match client.get(&url).send().await {
                Ok(resp) => match resp.error_for_status() {
                    Ok(r) => match r.bytes().await {
                        Ok(b) => b,
                        Err(e) => {
                            last_err = format!("{url}: 读取响应失败 {e}");
                            continue;
                        }
                    },
                    Err(e) => {
                        last_err = format!("{url}: HTTP {e}");
                        continue;
                    }
                },
                Err(e) => {
                    last_err = format!("{url}: 请求失败 {e}");
                    continue;
                }
            };
            let file = match parse_file(&bytes, year) {
                Ok(f) => f,
                Err(e) => {
                    last_err = format!("{url}: {e}");
                    continue;
                }
            };
            let stat = YearStat {
                year,
                off_days: file.days.iter().filter(|d| d.is_off_day).count(),
                work_days: file.days.iter().filter(|d| !d.is_off_day).count(),
            };
            let path = user_path(app, year);
            if let Some(dir) = path.parent() {
                if let Err(e) = fs::create_dir_all(dir) {
                    last_err = format!("创建数据目录失败: {e}");
                    continue;
                }
            }
            match fs::write(&path, &bytes) {
                Ok(_) => {
                    summary.updated.push(stat);
                }
                Err(e) => last_err = format!("写入 {} 失败: {e}", path.display()),
            }
            break;
        }
        if !summary.updated.iter().any(|s| s.year == year) && !last_err.is_empty() {
            summary.failed.push(last_err);
        }
    }
    summary
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bundled_data_parses() {
        for (bytes, year) in BUNDLED {
            let f = parse_file(bytes, *year).expect("内置节假日数据应可解析");
            assert!(!f.days.is_empty());
        }
    }
}
