import { Dog } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  /** 圆片直径 px */
  size?: number;
  className?: string;
}

/**
 * Luna 的头像 = 她的狗牌：黄铜色圆片 + Dog 线性图标。
 * 不画具体的狗（手画 SVG 达不到预期），狗感由狗牌元素与文案承载。
 */
export function LunaTag({ size = 64, className }: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Dog size={Math.round(size * 0.52)} strokeWidth={1.75} />
    </div>
  );
}
