import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

import { Header } from "@/components/Header";
import { MonthGrid } from "@/components/MonthGrid";
import { AlmanacBar } from "@/components/AlmanacBar";
import { SettingsModal } from "@/components/SettingsModal";
import { ToastContainer } from "@/components/ToastContainer";
import { useUiStore } from "@/stores/uiStore";

export default function App() {
  const settings = useUiStore((s) => s.settings);
  const showAlmanac = settings?.showAlmanac ?? true;

  useEffect(() => {
    void useUiStore.getState().bootstrap();
    // 跟随系统主题
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => useUiStore.getState().resolveTheme();
    mq.addEventListener("change", onSchemeChange);
    // 跨天：Rust 午夜通知
    const unlisten = listen("date-changed", () => {
      useUiStore.getState().bumpDay();
    });
    return () => {
      mq.removeEventListener("change", onSchemeChange);
      void unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="h-full w-full p-5">
      {/* 狗牌入场：轻晃一下落定，之后不再动 */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl animate-tag-swing">
        <Header />
        <MonthGrid />
        {showAlmanac && <AlmanacBar />}
      </div>
      <SettingsModal />
      <ToastContainer />
    </div>
  );
}
