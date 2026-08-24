import { useCallback, useEffect, useState, type ReactNode } from "react";

/* ---------- status ---------- */

export type Tone = "ok" | "warn" | "danger" | "info" | "muted";

const toneColor: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

const toneText: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  muted: "text-muted-foreground",
};

export function StatusDot({ tone = "ok", live = false }: { tone?: Tone; live?: boolean | undefined }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${toneColor[tone]} ${live ? "neko-live" : ""}`}
    />
  );
}

export function StatusPill({
  tone = "ok",
  label,
  icon,
  live,
}: {
  tone?: Tone | undefined;
  label: string;
  icon?: string | undefined;
  live?: boolean | undefined;
}) {
  return (
    <span className="neko-chip" title={label}>
      {icon ? <i className={`fa-solid ${icon} ${toneText[tone]}`} aria-hidden="true" /> : <StatusDot tone={tone} live={live} />}
      <span className={toneText[tone]}>{label}</span>
    </span>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const isGet = method === "GET";
  return (
    <span
      className={`inline-flex min-w-[3.25rem] justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold tracking-wider ${
        isGet ? "border-get/40 text-get" : "border-post/40 text-post"
      }`}
      style={{ backgroundColor: `color-mix(in oklab, var(--${isGet ? "method-get" : "method-post"}) 12%, transparent)` }}
    >
      {method}
    </span>
  );
}

/* ---------- copy ---------- */

export function CopyButton({
  value,
  label = "Copy",
  compact = false,
  title,
}: {
  value: string;
  label?: string | undefined;
  compact?: boolean | undefined;
  title?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
  }, [value]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={copy}
      className={`neko-btn ${compact ? "!min-h-7 !px-2 !py-1 text-xs" : ""}`}
      aria-label={title ?? `${label}: ${value}`}
      title={title ?? label}
    >
      <i className={`fa-regular ${copied ? "fa-circle-check text-ok" : "fa-copy"}`} aria-hidden="true" />
      <span className={compact ? "sr-only sm:not-sr-only" : ""}>{copied ? "Copied" : label}</span>
    </button>
  );
}

/* ---------- layout bits ---------- */

export function Panel({
  title,
  icon,
  actions,
  children,
  className = "",
}: {
  title?: string | undefined;
  icon?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={`neko-panel neko-enter ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="neko-label flex items-center gap-2 !text-foreground">
            {icon ? <i className={`fa-solid ${icon} text-accent`} aria-hidden="true" /> : null}
            {title}
          </h2>
          {actions}
        </header>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  unit,
  icon,
  hint,
  loading,
}: {
  label: string;
  value: ReactNode;
  unit?: string | undefined;
  icon?: string | undefined;
  hint?: string | undefined;
  loading?: boolean | undefined;
}) {
  return (
    <div className="neko-panel px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="neko-label">{label}</span>
        {icon ? <i className={`fa-solid ${icon} text-xs text-muted-foreground`} aria-hidden="true" /> : null}
      </div>
      {loading ? (
        <div className="neko-skeleton mt-2 h-6 w-20" />
      ) : (
        <p className="mt-1 font-mono text-xl leading-tight tabular-nums">
          {value}
          {unit ? <span className="ml-1 text-xs text-muted-foreground">{unit}</span> : null}
        </p>
      )}
      {hint ? <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`neko-skeleton ${className}`} />;
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <i className={`fa-solid ${icon} text-2xl text-muted-foreground`} aria-hidden="true" />
      <p className="text-sm">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ---------- charts ---------- */

export function Sparkline({
  values,
  label,
  color = "var(--accent)",
  height = 44,
}: {
  values: number[];
  label: string;
  color?: string;
  height?: number;
}) {
  const data = values.length ? values : [0];
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${(100 - (v / max) * 92).toFixed(2)}`);
  const line = points.join(" ");
  const area = `0,100 ${line} 100,100`;

  return (
    <figure className="w-full" aria-label={`${label} chart, latest value ${data[data.length - 1]}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} role="img">
        <polygon points={area} fill={color} opacity="0.1" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}

export function Bar({ label, percent, tone = "ok" }: { label: string; percent: number | null; tone?: Tone }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="neko-label">{label}</span>
        <span className="font-mono text-xs tabular-nums">
          {percent === null ? <span className="text-muted-foreground">n/a</span> : `${percent.toFixed(1)}%`}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-2">
        <div
          className={`h-full ${toneColor[tone]} transition-[width] duration-500`}
          style={{ width: `${percent === null ? 0 : Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
