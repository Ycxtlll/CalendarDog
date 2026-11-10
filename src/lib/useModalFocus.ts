import { useEffect, type RefObject } from "react";

interface Options {
  /** 常驻挂载的弹窗必须传 open 状态，否则 effect 只在挂载时跑一次 */
  active: boolean;
  onEscape?: () => void;
}

/** 弹窗焦点管理：自动聚焦首个控件、Tab 循环、Esc 关闭 */
export function useModalFocus(
  ref: RefObject<HTMLElement | null>,
  { active, onEscape }: Options,
) {
  useEffect(() => {
    if (!active) return;
    const panel = ref.current;
    panel
      ?.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea, button",
      )
      ?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'input:not([type=hidden]), select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [active, onEscape, ref]);
}
