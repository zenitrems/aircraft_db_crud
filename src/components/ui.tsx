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
  primary: "border-ops-text bg-ops-text text-ops-panel hover:border-ops-accent hover:bg-ops-accent",
  secondary: "border-ops-border bg-ops-panel text-ops-secondary hover:border-ops-text hover:text-ops-text",
  ghost: "border-transparent bg-transparent text-ops-secondary hover:bg-ops-surface hover:text-ops-text",
  danger: "border-red-500/30 bg-red-500/10 text-ops-danger hover:border-ops-danger",
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
        "rounded-md border font-mono uppercase tracking-[0.08em] transition disabled:cursor-default disabled:opacity-50",
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
      className={cn("overflow-hidden rounded-md border border-ops-border bg-ops-panel shadow-sm", className)}
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
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ops-dim">{eyebrow}</div>
        <div className="mt-1 text-2xl font-semibold leading-tight text-ops-text">{title}</div>
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
        "border-b border-ops-border px-3 py-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-ops-dim",
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
