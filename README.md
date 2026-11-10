# CalendarDog

托盘日历工具：点托盘弹出月历，农历、节气、节日、黄历宜忌、法定节假日休班标记。

Tauri 2 + React 18 + TypeScript + Tailwind CSS。签名元素是 Luna 的黄铜狗牌——托盘图标每天重新生成，刻上当天的日期数字。

## 开发

```bash
npm install
npm run tauri dev
```

## 构建

```bash
npm run build:installer   # NSIS 安装包
```

详细架构见 [AGENTS.md](AGENTS.md)。
