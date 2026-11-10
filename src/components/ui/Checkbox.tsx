import { Check } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

/** 自绘复选框（保留隐藏原生 input），任何地方不要写原生 checkbox */
export function Checkbox({ checked, onChange, children, disabled }: Props) {
  return (
    <label
      className={`group flex items-start gap-2 select-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border bg-background transition-colors ${
          checked
            ? "border-primary bg-primary"
            : "border-border group-hover:border-primary/50"
        }`}
      >
        <Check
          size={12}
          strokeWidth={3}
          className={`${checked ? "text-primary-foreground" : "text-transparent"}`}
        />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children != null && <span className="text-sm">{children}</span>}
    </label>
  );
}
