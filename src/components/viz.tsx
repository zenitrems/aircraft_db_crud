import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/**
 * Chart primitives. Every form here plots a single series, so none of them
 * needs a legend — the panel title names what is plotted. The heatmap is the
 * one exception and ships its own sequential ramp key.
 *
 * Colors come from the `--seq-*` ramp and the accent token, which are defined
 * per theme in globals.css, so dark and light are each stepped for their own
 * surface rather than flipped.
 */

const nf = new Intl.NumberFormat("es-MX");

export function formatNumber(value: number | null | undefined) {
  return nf.format(value ?? 0);
}

export function formatPct(part: number, whole: number, digits = 0) {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(digits)}%`;
}

/* ------------------------------------------------------------- stat tiles */

type StatProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "accent" | "danger";
};

export function Stat({ label, value, hint, tone = "default" }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center px-3 py-2">
      <div className="ops-eyebrow truncate">{label}</div>
      <div
        className={cn(
          "mt-1 text-[19px] font-semibold leading-none tracking-[-0.02em]",
          tone === "accent" && "text-ops-accent",
          tone === "danger" && "text-ops-danger",
          tone === "default" && "text-ops-text",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 truncate text-[10.5px] leading-tight text-ops-dim">{hint}</div>}
    </div>
  );
}

/** Hero figure — exactly one per view. */
export function Hero({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="px-3 py-2">
      <div className="ops-eyebrow">{label}</div>
      <div className="mt-1 text-[48px] font-semibold leading-[0.95] tracking-[-0.03em] text-ops-text">
        {value}
      </div>
      {hint && <div className="mt-1.5 text-[11px] text-ops-dim">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ meter */

/** Fill carries the magnitude; the track is a recessive step of the surface. */
export function Meter({
  value,
  total,
  tone = "accent",
}: {
  value: number;
  total: number;
  tone?: "accent" | "danger";
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ops-track">
      <div
        className={cn("h-full rounded-full", tone === "danger" ? "bg-ops-danger" : "bg-ops-accent")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ ranked bars */

export type RankedItem = {
  name: string;
  total: number;
  /** Optional right-hand figure — text, not a second series. */
  note?: string;
};

export function RankedBars({
  items,
  max,
  labelWidth = "7.5rem",
  emptyLabel = "Sin datos",
}: {
  items: RankedItem[];
  max?: number;
  labelWidth?: string;
  emptyLabel?: string;
}) {
  const peak = max ?? Math.max(1, ...items.map(item => item.total));

  if (items.length === 0) {
    return <div className="px-3 py-6 text-center font-mono text-[11px] text-ops-faint">{emptyLabel}</div>;
  }

  return (
    <ul className="divide-y divide-ops-border">
      {items.map(item => (
        <li
          key={item.name}
          className="grid items-center gap-2 px-3 py-[5px] transition-colors hover:bg-ops-hover"
          style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr) auto` }}
          title={`${item.name}: ${formatNumber(item.total)}${item.note ? ` · ${item.note}` : ""}`}
        >
          <span className="truncate text-[11.5px] text-ops-secondary">{item.name}</span>
          <span className="h-2 w-full rounded-sm bg-ops-track" aria-hidden="true">
            <span
              className="block h-full rounded-r-[3px] bg-ops-accent"
              style={{ width: `${Math.max(1.5, (item.total / peak) * 100)}%` }}
            />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="tnum w-8 text-right font-mono text-[11.5px] text-ops-text">
              {formatNumber(item.total)}
            </span>
            {item.note && (
              <span className="tnum w-10 text-right font-mono text-[10px] text-ops-dim">{item.note}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------- column chart */

/** Monthly additions. Only the peak is direct-labeled; the rest sit in tooltips. */
export function ColumnChart({
  points,
  height = 76,
}: {
  points: Array<{ label: string; value: number; caption: string }>;
  height?: number;
}) {
  if (points.length === 0) {
    return <div className="px-3 py-6 text-center font-mono text-[11px] text-ops-faint">Sin altas registradas</div>;
  }

  const peak = Math.max(1, ...points.map(point => point.value));
  const peakIndex = points.findIndex(point => point.value === peak);
  // Reserve a band above the plot so the peak label sits on the cap, never on it.
  const labelBand = 12;
  const plot = Math.max(24, height - labelBand);

  return (
    <div className="px-3 py-2">
      <div className="flex items-end gap-[3px] border-b border-ops-grid" style={{ height }}>
        {points.map((point, index) => (
          <div
            key={point.caption}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end"
            title={`${point.caption}: ${formatNumber(point.value)}`}
          >
            <span
              className="tnum font-mono text-[9.5px] leading-[12px] text-ops-text"
              style={{ visibility: index === peakIndex && peak > 0 ? "visible" : "hidden" }}
            >
              {formatNumber(peak)}
            </span>
            <div
              className={cn(
                "w-full max-w-6 rounded-t-[3px] transition-colors",
                index === peakIndex ? "bg-ops-accent" : "bg-ops-accent/45 group-hover:bg-ops-accent",
              )}
              style={{ height: `${Math.max(point.value === 0 ? 1 : 3, (point.value / peak) * plot)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {points.map((point, index) => (
          <div
            key={point.caption}
            className="min-w-0 flex-1 text-center font-mono text-[9px] text-ops-faint"
          >
            {index % 2 === 0 || index === peakIndex || points.length <= 6 ? point.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- heatmap */

const RAMP = ["--seq-1", "--seq-2", "--seq-3", "--seq-4", "--seq-5", "--seq-6", "--seq-7"] as const;

function rampStep(value: number, peak: number) {
  if (value <= 0) return null;
  // sqrt keeps the long tail of small counts readable against the few big ones
  const ratio = Math.sqrt(value / peak);
  const index = Math.min(RAMP.length - 1, Math.max(0, Math.round(ratio * (RAMP.length - 1))));
  return RAMP[index];
}

export function Heatmap({
  rows,
  cols,
  valueAt,
}: {
  rows: string[];
  cols: string[];
  valueAt: (row: string, col: string) => number;
}) {
  const peak = Math.max(1, ...rows.flatMap(row => cols.map(col => valueAt(row, col))));

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full table-fixed border-separate border-spacing-[2px] px-3 pb-3 pt-1">
        <colgroup>
          <col style={{ width: 96 }} />
          {cols.map(col => (
            <col key={col} style={{ width: `${(100 / cols.length).toFixed(3)}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-ops-panel" />
            {cols.map(col => (
              <th
                key={col}
                className="pb-1 text-center font-mono text-[9px] font-normal uppercase tracking-[0.06em] text-ops-dim"
              >
                <span className="block truncate" title={col}>
                  {col}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row}>
              <th className="sticky left-0 z-10 bg-ops-panel pr-2 text-right font-mono text-[10px] font-normal text-ops-secondary">
                <span className="block max-w-[86px] truncate" title={row}>
                  {row}
                </span>
              </th>
              {cols.map(col => {
                const value = valueAt(row, col);
                const step = rampStep(value, peak);
                const strong = step === "--seq-6" || step === "--seq-7";

                return (
                  <td
                    key={col}
                    title={`${row} × ${col}: ${formatNumber(value)}`}
                    className={cn(
                      "tnum h-6 rounded-[3px] text-center font-mono text-[10px] transition-opacity hover:opacity-80",
                      step ? (strong ? "text-ops-void" : "text-ops-text") : "text-ops-faint",
                    )}
                    style={{ background: step ? `var(${step})` : "var(--track)" }}
                  >
                    {value > 0 ? value : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Key for the heatmap's sequential ramp. */
export function RampLegend({ peak }: { peak: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[9px] text-ops-faint">0</span>
      <span className="flex gap-px">
        {RAMP.map(step => (
          <span key={step} className="h-2 w-3 rounded-[1px]" style={{ background: `var(${step})` }} />
        ))}
      </span>
      <span className="tnum font-mono text-[9px] text-ops-faint">{formatNumber(peak)}</span>
    </div>
  );
}
