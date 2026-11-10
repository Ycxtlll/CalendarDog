import { useEffect, useState } from "react";

/** 关闭后停留 delay 毫秒再卸载，用于播放对称退出动画 */
export function useDelayedUnmount(open: boolean, delay = 160): boolean {
  const [show, setShow] = useState(open);

  useEffect(() => {
    if (open) {
      setShow(true);
      return;
    }
    const t = setTimeout(() => setShow(false), delay);
    return () => clearTimeout(t);
  }, [open, delay]);

  return show;
}
