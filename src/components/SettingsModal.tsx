import { useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/Checkbox";
import { LunaTag } from "@/components/luna/LunaTag";
import { useDelayedUnmount } from "@/lib/useDelayedUnmount";
import { useModalFocus } from "@/lib/useModalFocus";
import { updateHolidays } from "@/services/holidayService";
import { useUiStore } from "@/stores/uiStore";
import { toast } from "@/stores/toastStore";
import type { Settings, ThemeMode } from "@/types";
import { cn } from "@/lib/utils";

export function SettingsModal() {
  const { t, i18n } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const { settingsOpen, closeSettings, settings, saveSettings } = useUiStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const show = useDelayedUnmount(settingsOpen);
  const closing = show && !settingsOpen;
  const [draft, setDraft] = useState<Settings | null>(null);
  const [updating, setUpdating] = useState(false);
  const [version, setVersion] = useState<string>("");

  useModalFocus(panelRef, {
    active: settingsOpen,
    onEscape: () => useUiStore.getState().closeSettings(),
  });

  // 打开时重置草稿；关闭期间保持渲染
  useEffect(() => {
    if (settingsOpen && settings) {
      setDraft({ ...settings });
    }
  }, [settingsOpen, settings]);

  useEffect(() => {
    if (!settingsOpen) return;
    getVersion().then(setVersion).catch(() => setVersion(""));
  }, [settingsOpen]);

  if (!show || !draft) return null;

  const save = () => {
    void saveSettings(draft).then(() => {
      toast(t("saved"));
      closeSettings();
    });
  };

  const doUpdate = () => {
    setUpdating(true);
    const now = new Date();
    const years = [now.getFullYear(), now.getFullYear() + 1];
    updateHolidays()
      .then((summary) => {
        if (summary.updated.length > 0) {
          const detail = summary.updated
            .map((s) =>
              t("yearStat", { year: s.year, off: s.offDays, work: s.workDays }),
            )
            .join(i18n.language.startsWith("zh") ? "、" : ", ");
          toast(t("updateSuccess", { detail }));
        } else if (summary.failed.length > 0) {
          toast(t("updateFail", { detail: summary.failed.join("；") }), "error");
        }
        void useUiStore.getState().refreshYears(years);
      })
      .catch((e) => {
        toast(t("updateFail", { detail: String(e) }), "error");
      })
      .finally(() => setUpdating(false));
  };

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("themeSystem") },
    { value: "light", label: t("themeDay") },
    { value: "dark", label: t("themeNight") },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        closing ? "animate-overlay-out" : "animate-overlay-in",
      )}
      onClick={closeSettings}
    >
      <div
        ref={panelRef}
        className={cn(
          "flex max-h-full w-[420px] flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-2xl",
          closing ? "animate-modal-out" : "animate-modal-in",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 外观 */}
        <section className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-muted-foreground">
            {t("appearance")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("theme")}</span>
            <div className="flex rounded-md border border-border bg-muted p-0.5">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDraft({ ...draft, theme: opt.value })}
                  className={cn(
                    "rounded-[4px] px-2 py-0.5 text-xs transition-colors",
                    draft.theme === opt.value
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Checkbox
            checked={draft.weekStartMonday}
            onChange={(v) => setDraft({ ...draft, weekStartMonday: v })}
          >
            {t("weekStart")}
          </Checkbox>
          <Checkbox
            checked={draft.showAlmanac}
            onChange={(v) => setDraft({ ...draft, showAlmanac: v })}
          >
            {t("showAlmanac")}
          </Checkbox>
        </section>

        {/* 节假日数据 */}
        <HolidaySection onUpdate={doUpdate} updating={updating} />

        {/* 关于 */}
        <section className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-muted-foreground">
            {t("about")}
          </div>
          <div className="flex items-center gap-3 rounded-md bg-muted/60 p-3">
            <LunaTag size={72} />
            <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
              <div className="font-medium text-foreground">{t("lunaProfile")}</div>
              <div className="mt-1">{t("aboutLine")}</div>
              <div className="mt-1">
                {t("version")} {version || "0.1.0"} · {t("holidaySource")}
              </div>
            </div>
          </div>
        </section>

        {/* 操作行 */}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <button
            onClick={closeSettings}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={save}
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          >
            {tc("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function HolidaySection({
  onUpdate,
  updating,
}: {
  onUpdate: () => void;
  updating: boolean;
}) {
  const { t } = useTranslation("settings");
  const { holidaysByYear, ensureYear } = useUiStore();
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() + 1];

  useEffect(() => {
    for (const y of years) void ensureYear(y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = holidaysByYear[now.getFullYear()];
  const stats = years.map((y) => ({ year: y, data: holidaysByYear[y] }));

  return (
    <section className="flex flex-col gap-2.5">
      <div className="text-xs font-semibold text-muted-foreground">
        {t("holidays")}
      </div>
      {!current && (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-2">
          <LunaTag size={56} />
          <div className="flex-1 text-xs">
            <div className="font-medium">{t("noData")}</div>
            <div className="mt-0.5 text-muted-foreground">{t("noDataDesc")}</div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {stats.map(({ year, data }) => (
          <div key={year}>
            {data
              ? t("holidayStatus", {
                  year,
                  off: Object.values(data.dates).filter((d) => d.type === "holiday")
                    .length,
                  work: Object.values(data.dates).filter((d) => d.type === "workday")
                    .length,
                })
              : t("holidayStatus", { year, off: "-", work: "-" })}
          </div>
        ))}
        <div>{t("almanacNote")}</div>
      </div>
      <button
        onClick={onUpdate}
        disabled={updating}
        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-60"
      >
        {updating ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <RefreshCw size={13} />
        )}
        {updating ? t("updating") : t("updateHolidays")}
      </button>
    </section>
  );
}
