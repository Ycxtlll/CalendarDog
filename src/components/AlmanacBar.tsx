import { useTranslation } from "react-i18next";

import { getDayMeta } from "@/lib/lunar";
import { holidayMapFor, useUiStore } from "@/stores/uiStore";

/** 底部黄历：宜/忌两行，楷体。设置里关掉就不渲染 */
export function AlmanacBar() {
  const { t } = useTranslation("calendar");
  const { selectedKey, viewMonth, viewYear, holidaysByYear } = useUiStore();

  const [y, m, d] = selectedKey.split("-").map(Number);
  const meta = getDayMeta(
    new Date(y, m - 1, d),
    viewMonth,
    holidayMapFor(holidaysByYear, viewYear),
  );
  const yi = meta.yi.length > 0 ? meta.yi : [t("almanacNone")];
  const ji = meta.ji.length > 0 ? meta.ji : [t("almanacNone")];

  return (
    <div className="border-t border-border bg-muted/60 px-4 py-2 font-almanac text-[13px] leading-snug">
      <div className="flex items-baseline gap-2">
        <span className="w-4 shrink-0 text-center font-bold text-holiday-green">
          {t("yi")}
        </span>
        <span className="truncate" title={yi.join(" · ")}>
          {yi.join(" · ")}
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="w-4 shrink-0 text-center font-bold text-work-red">
          {t("ji")}
        </span>
        <span className="truncate" title={ji.join(" · ")}>
          {ji.join(" · ")}
        </span>
      </div>
    </div>
  );
}
