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

/* ---------------------------------------------------------------- buttons */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "xs" | "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-ops-accent bg-ops-accent text-ops-void hover:border-ops-accentStrong hover:bg-ops-accentStrong",
  secondary: "border-ops-border bg-ops-elevated text-ops-secondary hover:border-ops-borderStrong hover:text-ops-text",
  ghost: "border-transparent bg-transparent text-ops-dim hover:bg-ops-hover hover:text-ops-text",
  danger: "border-ops-border bg-transparent text-ops-danger hover:border-ops-danger hover:bg-ops-dangerGhost",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-[22px] px-1.5 text-[10px]",
  sm: "h-[24px] px-2 text-[10.5px]",
  md: "h-[28px] px-3 text-[11px]",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded border font-mono tracking-[0.04em] transition-colors disabled:pointer-events-none disabled:opacity-35",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------------------- surfaces */

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-ops-border bg-ops-panel", className)}
      {...props}
    />
  );
}

type PanelHeadProps = {
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
};

/** Card header: one line of identity, one optional line of explanation. */
export function PanelHead({ title, hint, right, className }: PanelHeadProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-ops-border px-3 py-2", className)}>
      <div className="min-w-0">
        <div className="ops-eyebrow">{title}</div>
        {hint && <div className="mt-0.5 truncate text-[11px] text-ops-dim">{hint}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
};

export function SectionHeader({ eyebrow, title, meta }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[15px] font-semibold leading-none tracking-[-0.01em] text-ops-text">{title}</h2>
        <span className="ops-eyebrow">{eyebrow}</span>
      </div>
      {meta}
    </div>
  );
}

/* ----------------------------------------------------------------- fields */

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("ops-eyebrow mb-1 block", className)} {...props} />;
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

/* ----------------------------------------------------------------- tables */

export function TableHeaderCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-ops-border bg-ops-elevated px-2 py-1.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-ops-dim",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyTableState({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-2 py-12 text-center font-mono text-[11px] text-ops-faint">
        {children}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------ small parts */

type BadgeTone = "neutral" | "accent" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-ops-border bg-ops-elevated text-ops-dim",
  accent: "border-ops-active bg-ops-accentGhost text-ops-accent",
  danger: "border-ops-danger/40 bg-ops-dangerGhost text-ops-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.1em]",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Fixed toast. Kept dumb: callers own the timer. */
export function Toast({ message, type }: { message: string; type: "ok" | "err" }) {
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-4 right-4 z-[200] flex items-center gap-2 rounded border px-3 py-2 font-mono text-[11px] shadow-lg",
        type === "ok"
          ? "border-ops-active bg-ops-panel text-ops-accent"
          : "border-ops-danger bg-ops-panel text-ops-danger",
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", type === "ok" ? "bg-ops-accent" : "bg-ops-danger")} />
      {message}
    </div>
  );
}
