import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
}

/**
 * Luna：黑白色雌性边牧，脖子上挂黄铜狗牌。
 * 颜色走主题 token：毛=前景色，白斑=背景色，狗牌=primary。
 * 只出现在空状态/设置/关于，不进日历主界面。
 */
export function LunaMascot({ size = 96, className }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* 尾巴（白色尾尖） */}
      <path
        d="M88 82 Q104 74 102 56"
        fill="none"
        className="stroke-foreground"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="102" cy="54" r="6" className="fill-background" />
      <circle cx="102" cy="54" r="6" className="fill-none stroke-background" strokeWidth="11" />
      {/* 身体 */}
      <path
        d="M46 62 Q56 52 72 54 Q92 56 92 76 Q92 96 70 98 Q48 96 46 62 Z"
        className="fill-foreground"
      />
      {/* 白胸 */}
      <path
        d="M52 66 Q48 84 56 96 Q64 96 66 88 Q68 74 62 64 Q56 62 52 66 Z"
        className="fill-background"
      />
      {/* 前腿 */}
      <rect x="48" y="90" width="9" height="22" rx="4.5" className="fill-foreground" />
      <rect x="70" y="90" width="9" height="22" rx="4.5" className="fill-foreground" />
      <ellipse cx="52" cy="112" rx="5.5" ry="3.5" className="fill-background" />
      <ellipse cx="74" cy="112" rx="5.5" ry="3.5" className="fill-background" />
      {/* 头（微偏向左侧） */}
      <circle cx="42" cy="42" r="20" className="fill-foreground" />
      {/* 白面白鼻梁 */}
      <path
        d="M40 23 Q44 32 43 46 Q42 56 36 58 Q30 56 30 46 Q32 30 40 23 Z"
        className="fill-background"
      />
      {/* 白脸颊 */}
      <path d="M28 46 Q24 56 32 60 Q38 60 38 52 Q36 46 28 46 Z" className="fill-background" />
      {/* 耳朵：立耳，左耳白耳尖 */}
      <path d="M30 28 L25 8 L46 20 Z" className="fill-foreground" />
      <path d="M27 13 L25 8 L33 12 Z" className="fill-background" />
      <path d="M52 24 L60 6 L40 16 Z" className="fill-foreground" />
      {/* 眼睛 */}
      <circle cx="46" cy="40" r="3.2" className="fill-background" />
      <circle cx="47" cy="39" r="1" className="fill-foreground" />
      <circle cx="36" cy="40" r="2.6" className="fill-background" />
      {/* 鼻头 */}
      <ellipse cx="30" cy="49" rx="3.6" ry="3" className="fill-foreground" />
      <ellipse cx="30" cy="48.2" rx="1.6" ry="1.2" className="fill-background" />
      {/* 项圈 + 黄铜狗牌 */}
      <path d="M26 62 Q42 70 56 64" fill="none" className="stroke-work-red" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="52" cy="70" r="6" className="fill-primary stroke-foreground" strokeWidth="1.5" />
      <circle cx="52" cy="68" r="1.4" className="fill-background" />
    </svg>
  );
}
