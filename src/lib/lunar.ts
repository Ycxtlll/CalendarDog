import { Solar } from "lunar-typescript";

import type { HolidayInfo } from "@/types";
import { dateKey } from "@/lib/utils";

export interface DayMeta {
  key: string;
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  /** 是否属于当前显示月（跨月置灰） */
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  /** 日期下的小字：节日 > 节气 > 农历 */
  subText: string;
  term: string | null;
  festival: string | null;
  holiday: HolidayInfo | null;
  /** 头部农历行：十月初二 */
  lunarMonthDay: string;
  /** 丙午 */
  ganZhiYear: string;
  /** 马 */
  shengXiao: string;
  yi: string[];
  ji: string[];
}

const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];

/** 农历月名，初一时小字显示月名而不是「初一」 */
function lunarDayText(lunar: ReturnType<Solar["getLunar"]>): string {
  if (lunar.getDayInChinese() === "初一") {
    return `${lunar.getMonthInChinese()}月`;
  }
  return lunar.getDayInChinese();
}

export function getDayMeta(
  date: Date,
  viewMonth: number,
  holidayMap: Record<string, HolidayInfo> | undefined,
): DayMeta {
  const solar = Solar.fromYmd(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const lunar = solar.getLunar();
  const term = lunar.getJieQi() || null;
  const festival = solar.getFestivals()[0] ?? lunar.getFestivals()[0] ?? null;
  const subText = festival ?? term ?? lunarDayText(lunar);
  const weekday = date.getDay();
  return {
    key: dateKey(date),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    inMonth: date.getMonth() + 1 === viewMonth,
    isToday: dateKey(date) === dateKey(new Date()),
    isWeekend: weekday === 0 || weekday === 6,
    subText,
    term,
    festival,
    holiday: holidayMap?.[dateKey(date)] ?? null,
    lunarMonthDay: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganZhiYear: lunar.getYearInGanZhi(),
    shengXiao: lunar.getYearShengXiao(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
  };
}

export function weekdayChar(date: Date, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return `星期${WEEKDAY_ZH[date.getDay()]}`;
  }
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
