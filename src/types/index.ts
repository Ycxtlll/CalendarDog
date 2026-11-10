export type ThemeMode = "system" | "light" | "dark";

export interface Settings {
  theme: ThemeMode;
  pinned: boolean;
  autostart: boolean;
  weekStartMonday: boolean;
  showAlmanac: boolean;
}

export interface HolidayInfo {
  /** "holiday" = 休 | "workday" = 班 */
  type: "holiday" | "workday";
  name: string;
}

export interface YearHolidays {
  year: number;
  source: string | null;
  dates: Record<string, HolidayInfo>;
}

export interface YearStat {
  year: number;
  offDays: number;
  workDays: number;
}

export interface UpdateSummary {
  updated: YearStat[];
  failed: string[];
}
