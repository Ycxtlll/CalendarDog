import { create } from "zustand";

import { getSettings, setSettings, togglePin } from "@/services/settingsService";
import { getYearHolidays } from "@/services/holidayService";
import type { HolidayInfo, Settings, ThemeMode, YearHolidays } from "@/types";
import { dateKey } from "@/lib/utils";

interface UiState {
  settings: Settings | null;
  resolvedTheme: "light" | "dark";
  /** 当前显示的月份（1-12） */
  viewYear: number;
  viewMonth: number;
  /** 选中日期 YYYY-MM-DD */
  selectedKey: string;
  /** 跨天刷新计数器 */
  dayTick: number;
  /** 节假日数据（按年缓存） */
  holidaysByYear: Record<number, YearHolidays>;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  bootstrap: () => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  togglePin: () => Promise<void>;
  resolveTheme: () => void;
  setView: (year: number, month: number) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToday: () => void;
  select: (key: string) => void;
  bumpDay: () => void;
  ensureYear: (year: number) => Promise<void>;
  /** 联网更新后清掉指定年份缓存并重新拉取 */
  refreshYears: (years: number[]) => Promise<void>;
}

function resolve(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export const useUiStore = create<UiState>((set, get) => ({
  settings: null,
  resolvedTheme: "light",
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth() + 1,
  selectedKey: dateKey(new Date()),
  dayTick: 0,
  holidaysByYear: {},
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  bootstrap: async () => {
    const s = await getSettings();
    set({ settings: s, resolvedTheme: resolve(s.theme) });
    document.documentElement.dataset.theme = get().resolvedTheme;
    await get().ensureYear(new Date().getFullYear());
  },

  saveSettings: async (s) => {
    const saved = await setSettings(s);
    set({ settings: saved, resolvedTheme: resolve(saved.theme) });
    document.documentElement.dataset.theme = get().resolvedTheme;
  },

  togglePin: async () => {
    await togglePin();
    set((st) => ({
      settings: st.settings ? { ...st.settings, pinned: !st.settings.pinned } : null,
    }));
  },

  resolveTheme: () => {
    const s = get().settings;
    if (!s) return;
    const r = resolve(s.theme);
    if (r !== get().resolvedTheme) {
      set({ resolvedTheme: r });
      document.documentElement.dataset.theme = r;
    }
  },

  setView: (year, month) => set({ viewYear: year, viewMonth: month }),

  prevMonth: () =>
    set((st) => {
      const m = st.viewMonth === 1 ? 12 : st.viewMonth - 1;
      const y = st.viewMonth === 1 ? st.viewYear - 1 : st.viewYear;
      void get().ensureYear(y);
      return { viewMonth: m, viewYear: y };
    }),

  nextMonth: () =>
    set((st) => {
      const m = st.viewMonth === 12 ? 1 : st.viewMonth + 1;
      const y = st.viewMonth === 12 ? st.viewYear + 1 : st.viewYear;
      void get().ensureYear(y);
      return { viewMonth: m, viewYear: y };
    }),

  goToday: () => {
    const now = new Date();
    void get().ensureYear(now.getFullYear());
    set({
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth() + 1,
      selectedKey: dateKey(now),
      dayTick: get().dayTick + 1,
    });
  },

  select: (key) => set({ selectedKey: key }),

  bumpDay: () => {
    void get().ensureYear(new Date().getFullYear());
    set((st) => ({ dayTick: st.dayTick + 1 }));
  },

  ensureYear: async (year) => {
    if (get().holidaysByYear[year]) return;
    const data = await getYearHolidays(year);
    if (data) {
      set((st) => ({
        holidaysByYear: { ...st.holidaysByYear, [year]: data },
      }));
    }
  },

  refreshYears: async (years) => {
    set((st) => {
      const next = { ...st.holidaysByYear };
      for (const y of years) delete next[y];
      return { holidaysByYear: next };
    });
    for (const y of years) {
      await get().ensureYear(y);
    }
  },
}));

/** 供 DayCell 一次性取用：选中月 + 前后月的节假日 */
export function holidayMapFor(
  holidaysByYear: Record<number, YearHolidays>,
  year: number,
): Record<string, HolidayInfo> | undefined {
  return holidaysByYear[year]?.dates;
}
