import { useMemo, useState } from "react";
import { CopyButton } from "./primitives";

type Props = { value: unknown; maxHeight?: number };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function Node({ name, value, depth }: { name: string | null; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const branch = isObj(value) || Array.isArray(value);

  if (!branch) {
    const tone =
      typeof value === "string" ? "text-ok"
      : typeof value === "number" ? "text-info"
      : typeof value === "boolean" ? "text-warn"
      : "text-muted-foreground";
    return (
      <div className="whitespace-pre" style={{ paddingLeft: depth * 14 }}>
        {name !== null ? <span className="text-accent">&quot;{name}&quot;</span> : null}
        {name !== null ? <span className="text-muted-foreground">: </span> : null}
        <span className={tone}>{typeof value === "string" ? `"${value}"` : String(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const brackets = Array.isArray(value) ? ["[", "]"] : ["{", "}"];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 text-left hover:text-accent"
        style={{ paddingLeft: depth * 14 }}
        aria-expanded={open}
      >
        <i className={`fa-solid ${open ? "fa-caret-down" : "fa-caret-right"} w-2 text-muted-foreground`} aria-hidden="true" />
        {name !== null ? <span className="text-accent">&quot;{name}&quot;</span> : null}
        {name !== null ? <span className="text-muted-foreground">:</span> : null}
        <span className="text-muted-foreground">
          {brackets[0]}
          {open ? "" : ` ${entries.length} ${brackets[1]}`}
        </span>
      </button>
      {open ? (
        <>
          {entries.map(([k, v]) => (
            <Node key={k} name={Array.isArray(value) ? null : k} value={v} depth={depth + 1} />
          ))}
          <div className="text-muted-foreground" style={{ paddingLeft: depth * 14 }}>
            {brackets[1]}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function JsonViewer({ value, maxHeight = 380 }: Props) {
  const [raw, setRaw] = useState(false);
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);

  return (
    <div className="neko-panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <span className="neko-label flex items-center gap-2">
          <i className="fa-solid fa-code text-accent" aria-hidden="true" />
          JSON
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRaw((r) => !r)}
            className="neko-btn !min-h-7 !px-2 !py-1 text-xs"
            aria-pressed={raw}
          >
            <i className="fa-solid fa-align-left" aria-hidden="true" />
            {raw ? "Pretty" : "Raw"}
          </button>
          <CopyButton value={text} label="Copy JSON" compact />
        </div>
      </div>
      <div className="neko-scroll-x overflow-y-auto p-2 font-mono text-xs leading-relaxed" style={{ maxHeight }}>
        {raw ? <pre className="whitespace-pre">{text}</pre> : <Node name={null} value={value} depth={0} />}
      </div>
    </div>
  );
}
