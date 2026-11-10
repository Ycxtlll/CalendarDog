import { Moon, Pin, PinOff, Settings, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { holidayMapFor, useUiStore } from "@/stores/uiStore";
import { toast } from "@/stores/toastStore";
import { getDayMeta, weekdayChar } from "@/lib/lunar";
import type { ThemeMode } from "@/types";

function ToolButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function Header() {
  const { i18n } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const { t: ts } = useTranslation("settings");
  const {
    settings,
    resolvedTheme,
    selectedKey,
    viewMonth,
    holidaysByYear,
    togglePin,
    saveSettings,
    openSettings,
  } = useUiStore();

  const [y, m, d] = selectedKey.split("-").map(Number);
  const meta = getDayMeta(
    new Date(y, m - 1, d),
    viewMonth,
    holidayMapFor(holidaysByYear, y),
  );
  const pinned = settings?.pinned ?? false;
  const isZh = i18n.language.startsWith("zh");

  const cycleTheme = () => {
    if (!settings) return;
    const order: ThemeMode[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    void saveSettings({ ...settings, theme: next });
  };

  const onPin = () => {
    void togglePin().then(() => {
      toast(tc(pinned ? "pinOff" : "pinOn"));
    });
  };

  return (
    <div className="flex items-start justify-between px-5 pb-3 pt-5">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-date text-[44px] font-bold leading-none">
            {meta.day}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {isZh
              ? `${meta.month}月 · ${weekdayChar(new Date(y, m - 1, d), "zh")}`
              : `${meta.month}/${meta.year} · ${weekdayChar(new Date(y, m - 1, d), "en")}`}
          </span>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground">
          {meta.lunarMonthDay} · {meta.ganZhiYear}
          {meta.shengXiao}年
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 pt-1">
        <ToolButton
          onClick={cycleTheme}
          title={resolvedTheme === "dark" ? ts("themeDay") : ts("themeNight")}
        >
          {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </ToolButton>
        <ToolButton onClick={onPin} title={tc(pinned ? "unpinned" : "pinned")}>
          {pinned ? <Pin size={15} /> : <PinOff size={15} />}
        </ToolButton>
        <ToolButton onClick={openSettings} title={tc("settings")}>
          <Settings size={15} />
        </ToolButton>
      </div>
    </div>
  );
}
