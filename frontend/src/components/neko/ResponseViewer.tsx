import { JsonViewer } from "./JsonViewer";
import { CopyButton, Panel } from "./primitives";
import { formatBytes, type RawResult } from "@/lib/api-client";

function StatusTag({ status }: { status: number }) {
  const tone = status < 300 ? "text-ok" : status < 400 ? "text-info" : status < 500 ? "text-warn" : "text-danger";
  return (
    <span className={`neko-chip ${tone}`}>
      <i className="fa-solid fa-signal" aria-hidden="true" />
      {status}
    </span>
  );
}

export function ResponseViewer({ result }: { result: RawResult }) {
  const meta = (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusTag status={result.status} />
      <span className="neko-chip">
        <i className="fa-regular fa-clock" aria-hidden="true" />
        {result.ms}ms
      </span>
      <span className="neko-chip max-w-[12rem] truncate" title={result.contentType}>
        <i className="fa-solid fa-file-code" aria-hidden="true" />
        {result.contentType.split(";")[0]}
      </span>
    </div>
  );

  return (
    <Panel title="Response" icon="fa-reply" actions={meta}>
      {result.kind === "json" ? <JsonViewer value={result.json} /> : null}

      {result.kind === "text" ? (
        <div className="neko-panel">
          <div className="flex justify-end border-b border-border p-1.5">
            <CopyButton value={result.text ?? ""} label="Copy response" compact />
          </div>
          <pre className="neko-scroll-x max-h-80 overflow-y-auto p-2 font-mono text-xs">{result.text}</pre>
        </div>
      ) : null}

      {result.kind === "image" ? (
        <div className="space-y-2">
          <div className="neko-panel grid place-items-center overflow-hidden bg-surface-2 p-3">
            <img
              src={result.blobUrl}
              alt="Endpoint image response preview"
              className="max-h-64 w-auto rounded-sm"
            />
          </div>
          <FileMeta result={result} />
        </div>
      ) : null}

      {result.kind === "audio" || result.kind === "zip" || result.kind === "file" ? (
        <FileMeta result={result} />
      ) : null}
    </Panel>
  );
}

function FileMeta({ result }: { result: RawResult }) {
  const archive = result.kind === "zip";
  return (
    <div className="neko-panel p-3">
      <div className="flex items-start gap-3">
        <i
          className={`fa-solid ${archive ? "fa-file-zipper" : result.kind === "audio" ? "fa-file-audio" : result.kind === "image" ? "fa-file-image" : "fa-file"} mt-0.5 text-lg text-accent`}
          aria-hidden="true"
        />
        <dl className="min-w-0 flex-1 space-y-1 font-mono text-xs">
          <Row k="filename" v={result.headers["x-neko-archive-name"] ?? result.filename ?? "download"} />
          <Row k="size" v={formatBytes(result.size ?? 0)} />
          <Row k="mime" v={result.contentType.split(";")[0] ?? ""} />
          {result.headers["x-neko-source-mime"] ? (
            <Row k="packaged source" v={result.headers["x-neko-source-mime"]} />
          ) : null}
        </dl>
      </div>
      {archive ? (
        <p className="mt-2 text-[0.6875rem] text-muted-foreground">
          Video payloads are always delivered as a ZIP archive — never streamed to a player.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          className="neko-btn neko-btn-accent"
          href={result.blobUrl}
          download={result.headers["x-neko-archive-name"] ?? result.filename ?? "download"}
        >
          <i className="fa-solid fa-download" aria-hidden="true" />
          Download
        </a>
        <CopyButton value={JSON.stringify(result.headers, null, 2)} label="Copy headers" />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  );
}
