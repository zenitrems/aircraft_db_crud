import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-ops-active bg-ops-accentGhost text-ops-accentMuted hover:border-ops-accent",
  secondary: "border-ops-border bg-transparent text-ops-secondary hover:border-ops-active hover:text-ops-text",
  ghost: "border-transparent bg-transparent text-ops-secondary hover:bg-ops-accentGhost hover:text-ops-text",
  danger: "border-red-400/70 bg-red-400/10 text-ops-danger hover:bg-red-400/15",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-[10px]",
  md: "px-5 py-2 text-[11px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md border font-mono uppercase tracking-[0.1em] transition disabled:cursor-default disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-ops-border bg-ops-panel", className)}
      {...props}
    />
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
};

export function SectionHeader({ eyebrow, title, meta }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] text-ops-dim">{eyebrow}</div>
        <div className="mt-0.5 text-xl font-bold text-ops-text">{title}</div>
      </div>
      {meta}
    </div>
  );
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-[10px] uppercase tracking-[0.15em] text-ops-dim", className)}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ops-field", className)} {...props} />;
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("ops-field", className)} {...props} />;
}

export function TextareaInput({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("ops-field", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-ops-border px-3 py-2.5 text-left text-[10px] font-normal tracking-[0.15em] text-ops-dim",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyTableState({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-ops-dim">
        {children}
      </td>
    </tr>
  );
}
