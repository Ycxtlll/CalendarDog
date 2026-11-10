import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buildMonthGrid } from "@/lib/calendar";
import { getDayMeta } from "@/lib/lunar";
import { cn } from "@/lib/utils";
import { holidayMapFor, useUiStore } from "@/stores/uiStore";
import type { HolidayInfo } from "@/types";

type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const WEEK_MON_START: WeekdayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];
const WEEK_SUN_START: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function NavButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function MonthGrid() {
  const { t } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const {
    viewYear,
    viewMonth,
    settings,
    holidaysByYear,
    selectedKey,
    prevMonth,
    nextMonth,
    goToday,
    select,
  } = useUiStore();

  const weekStartMonday = settings?.weekStartMonday ?? true;
  const weekdays = weekStartMonday ? WEEK_MON_START : WEEK_SUN_START;
  const grid = buildMonthGrid(viewYear, viewMonth, weekStartMonday);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4">
      {/* 月份切换行 */}
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-sm font-semibold">
          {t("monthLabel", { year: viewYear, month: viewMonth })}
        </span>
        <div className="flex items-center gap-0.5">
          <NavButton onClick={goToday} title={tc("today")}>
            {tc("today")}
          </NavButton>
          <NavButton onClick={prevMonth}>
            <ChevronUp size={14} />
          </NavButton>
          <NavButton onClick={nextMonth}>
            <ChevronDown size={14} />
          </NavButton>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 px-1 pb-1">
        {weekdays.map((k) => (
          <div
            key={k}
            className="flex h-6 items-center justify-center text-xs text-muted-foreground"
          >
            {t(`weekdays.${k}`)}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-y-0.5 pb-1">
        {grid.flat().map((date) => (
          <DayCell
            key={date.getTime()}
            date={date}
            viewMonth={viewMonth}
            holidayMap={holidayMapFor(holidaysByYear, date.getFullYear())}
            selectedKey={selectedKey}
            onSelect={select}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  date,
  viewMonth,
  holidayMap,
  selectedKey,
  onSelect,
}: {
  date: Date;
  viewMonth: number;
  holidayMap: Record<string, HolidayInfo> | undefined;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const meta = getDayMeta(date, viewMonth, holidayMap);
  const selected = meta.key === selectedKey;
  const { t } = useTranslation("calendar");
  const badge = meta.holiday
    ? meta.holiday.type === "holiday"
      ? "休"
      : "班"
    : null;
  const badgeClass =
    meta.holiday?.type === "holiday" ? "text-holiday-green" : "text-work-red";
  const badgeTitle = meta.holiday
    ? meta.holiday.type === "holiday"
      ? t("holidayOff", { name: meta.holiday.name })
      : t("holidayWork", { name: meta.holiday.name })
    : undefined;

  // 数字变红：周末 / 节日 / 法定休日；今天由狗牌接管配色
  const numberRed =
    (meta.isWeekend || Boolean(meta.festival) || meta.holiday?.type === "holiday") &&
    !meta.isToday;

  const subColor = meta.isToday
    ? "font-semibold text-primary"
    : meta.festival
      ? "text-festival-red"
      : meta.term
        ? "text-holiday-green"
        : "text-muted-foreground";

  return (
    <button
      onClick={() => onSelect(meta.key)}
      title={badgeTitle}
      className={cn(
        "relative flex h-full min-h-0 flex-col items-center justify-start rounded-md pb-0.5 pt-1.5 transition-colors",
        meta.inMonth ? "" : "opacity-40",
        selected ? "bg-accent" : "hover:bg-accent/60",
      )}
    >
      {meta.isToday ? (
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary font-date text-lg font-semibold leading-none text-primary-foreground ring-2 ring-inset ring-primary-foreground/30">
          {meta.day}
        </span>
      ) : (
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center font-date text-lg font-semibold leading-none",
            numberRed ? "text-festival-red" : "text-foreground",
          )}
        >
          {meta.day}
        </span>
      )}
      <span className={cn("mt-0.5 max-w-full truncate px-0.5 text-[10px] leading-3", subColor)}>
        {meta.subText}
      </span>
      {badge && (
        <span
          className={cn(
            "absolute right-0.5 top-0.5 text-[9px] font-bold leading-none",
            badgeClass,
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
