# AGENTS.md

## Quick commands

| What | Command |
|------|---------|
| Frontend dev only | `npm run dev` (Vite on :2010) |
| Full Tauri dev (FE + Rust) | `npm run tauri dev` |
| Typecheck + build | `npm run build` (= `tsc && vite build`) |
| Rust typecheck | `cargo check`（在 `src-tauri/` 内） |
| Rust tests | `cargo test`（字体解析、图标绘制、节假日数据校验） |
| Tauri installer build | `npm run build:installer` (NSIS) |

- No lint, no formatter, no frontend tests, no CI configured.
- `tsc` is the only frontend typecheck；Rust 测试含 Baloo 2 字体解析（防依赖升级悄悄坏掉）。

## Architecture

- **Tauri 2.x 托盘常驻小工具** — Rust 后端（`src-tauri/`）+ React 18/TS 前端（`src/`）。
- **Path alias**: `@/*` → `./src/*` (tsconfig `paths`)。
- 无边框透明窗口（600×820 逻辑尺寸，四周 `p-5` 是阴影出血区，实际面板 560×780）。

### 前端 (`src/`)

```
src/
├── main.tsx / App.tsx          # 入口；面板 = Header + MonthGrid + AlmanacBar
├── components/
│   ├── Header.tsx              # 大数字 + 农历行 + 主题/钉住/设置工具条
│   ├── MonthGrid.tsx           # 6×7 网格 + DayCell（今天=狗牌圆、休班角标、节日/节气变色）
│   ├── AlmanacBar.tsx          # 宜/忌（楷体），设置可关
│   ├── SettingsModal.tsx       # 外观/节假日数据/关于（含联网更新按钮）
│   ├── luna/LunaMascot.tsx     # Luna SVG（黑白边牧+铜牌），只出现在空状态/设置/关于
│   └── ui/                     # Checkbox（自绘，禁原生）、EmptyState
├── stores/                     # Zustand：uiStore（主题/视图/选择/节假日缓存）、toastStore
├── services/                   # invoke 封装（settingsService / holidayService），组件不直接 invoke
├── lib/
│   ├── lunar.ts                # lunar-typescript 封装：DayMeta（节日>节气>农历 优先级）
│   ├── calendar.ts             # 6×7 网格构建
│   ├── i18n.ts / utils.ts / useModalFocus.ts / useDelayedUnmount.ts
├── locales/{en,zh}/            # i18next：common / calendar / settings，键必须中英同时加
└── types/index.ts
```

### 后端 (`src-tauri/src/`)

```
src-tauri/src/
├── main.rs        # Builder：single-instance / autostart 插件、blur 延迟隐藏、午夜刷新线程
├── state.rs       # AppState：pinned、suppress_blur_until_ms、tray_icon、settings
├── settings.rs    # settings.json 原子写（临时文件+rename）
├── holidays.rs    # holiday-cn 解析校验、内置兜底（include_bytes）、多镜像联网更新
├── date_icon.rs   # 狗牌托盘图标：fontdue 刻日期数字，字体失败退化为爪印（有单测）
├── tray.rs        # 托盘构建、点击锚定弹窗、blur 抑制标记
└── commands.rs    # get/set_settings、toggle_pin、get_year_holidays、update_holidays
```

- **签名元素 = Luna 的黄铜狗牌**：托盘图标每天零点后重绘（Rust 线程 sleep 到午夜 +1s），
  月历里「今天」是铜色圆形狗牌。全 UI 唯一暖色，其余黑白灰（边牧·白天/夜巡两套主题，
  token 在 `src/index.css`，全语义类，禁止硬编码色值）。
- **节假日数据**：内置 2026/2027（`src-tauri/resources/holidays/`，holiday-cn 原始 JSON）；
  联网更新（设置页按钮）写 `app_config_dir/holidays/{year}.json`，读取时用户文件优先于内置。
  多镜像：raw.githubusercontent → cdn.jsdelivr，各 10s 超时。
- **失焦隐藏**：blur 后 250ms 检查；托盘点击会先设 `suppress_blur_until_ms`（+800ms），
  钉住（pinned）时不隐藏且窗口置顶。
- **单实例**：二次启动唤起已有窗口。
- 日历算法全在前端（lunar-typescript），Rust 不管历法；跨天由 Rust emit `date-changed`。

## 依赖版本纪律

本机 rustc 1.89，**最新 tauri 系（2.12+/1.90 MSRV）装不上**。Cargo.lock 锁定的
tauri 2.11.1 / tauri-build 2.6.1 / tauri-utils 2.9.1 / tray-icon 0.23.1 / muda 0.19.1 /
plugins（single-instance 2.4.5、autostart 2.5.1）与 DBDog 一致、已验证可编译。
升级 rustc 之前不要 `cargo update` 全量刷新；单包升级后必须 `cargo check`。
降级顺序：先插件后核心（插件会卡住核心的 semver）。

## Version bumping

改版本时同步四处：`package.json`、`src-tauri/Cargo.toml`、
`src-tauri/Cargo.lock`（只动 `name = "calendardog"` 条目，**不要全局 replaceAll**）、
`docs/changelog.md`。
