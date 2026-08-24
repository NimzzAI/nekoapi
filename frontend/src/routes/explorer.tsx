import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ENDPOINTS, type EndpointSpec } from "@/api/core/registry";
import { execute, type RawResult } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { CopyButton, MethodBadge, Panel, Skeleton } from "@/components/neko/primitives";
import { ResponseViewer } from "@/components/neko/ResponseViewer";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: `API Explorer — ${siteConfig.name}` },
      { name: "description", content: "Run every NekoAPI endpoint from the browser: parameters, body, live response, media preview and downloads." },
      { property: "og:title", content: `API Explorer — ${siteConfig.name}` },
      { property: "og:description", content: "Interactive REST client for the NekoAPI endpoint catalog." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/explorer") }],
  }),
  component: Explorer,
});

function Explorer() {
  const [selectedId, setSelectedId] = useState(ENDPOINTS[0]!.id);
  const [filter, setFilter] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RawResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0]!,
    [selectedId],
  );

  const list = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? ENDPOINTS.filter((e) => `${e.method} ${e.path} ${e.name}`.toLowerCase().includes(q)) : ENDPOINTS;
  }, [filter]);

  const select = (e: EndpointSpec) => {
    setSelectedId(e.id);
    setValues({});
    setResult(null);
    setError(null);
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const query: Record<string, string> = {};
      const body: Record<string, unknown> = {};
      for (const p of endpoint.params) {
        const v = values[p.name];
        if (!v) continue;
        if (p.in === "query") query[p.name] = v;
        if (p.in === "body") body[p.name] = p.type === "number" ? Number(v) : v;
      }
      const res = await execute(endpoint.method, endpoint.path, {
        query,
        ...(endpoint.method === "POST" ? { body: JSON.stringify(body) } : {}),
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Panel title={`Catalog · ${list.length}`} icon="fa-list" className="lg:sticky lg:top-16 lg:self-start">
        <label className="sr-only" htmlFor="explorer-filter">
          Filter endpoints
        </label>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" aria-hidden="true" />
          <input
            id="explorer-filter"
            className="neko-input !pl-7"
            placeholder="filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <ul className="mt-2 max-h-[22rem] space-y-0.5 overflow-y-auto lg:max-h-[60vh]">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => select(e)}
                aria-current={e.id === endpoint.id}
                className={`flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                  e.id === endpoint.id
                    ? "border-accent/50 bg-accent/10"
                    : "border-transparent hover:border-border hover:bg-surface-2"
                }`}
              >
                <MethodBadge method={e.method} />
                <span className="truncate">{e.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="min-w-0 space-y-3">
        <section className="neko-panel neko-enter">
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <MethodBadge method={endpoint.method} />
            <code className="font-mono text-sm font-medium">{endpoint.path}</code>
            <div className="ml-auto flex gap-1.5">
              <CopyButton value={`${endpoint.method} ${endpoint.path}`} label="Copy" compact title="Copy endpoint path" />
            </div>
          </header>

          <div className="space-y-3 p-3">
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>

            <div className="flex flex-wrap gap-1.5">
              <span className="neko-chip">
                <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                {endpoint.rateLimit}
              </span>
              <span className="neko-chip">
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                {endpoint.category}
              </span>
              <span className="neko-chip">
                <i className="fa-solid fa-file-lines" aria-hidden="true" />
                {endpoint.responseKind}
              </span>
            </div>

            {endpoint.params.length ? (
              <div>
                <p className="neko-label mb-1.5">
                  {endpoint.method === "POST" ? "Body & parameters" : "Parameters"}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {endpoint.params.map((p) => (
                    <div key={p.name}>
                      <label className="flex items-baseline justify-between gap-2" htmlFor={`p-${p.name}`}>
                        <span className="font-mono text-xs">
                          {p.name}
                          {p.required ? <span className="ml-1 text-danger">*</span> : null}
                        </span>
                        <span className="neko-label !text-[0.625rem]">{p.in}</span>
                      </label>
                      <input
                        id={`p-${p.name}`}
                        className="neko-input mt-1"
                        placeholder={p.example ?? p.type}
                        value={values[p.name] ?? ""}
                        onChange={(ev) => setValues((v) => ({ ...v, [p.name]: ev.target.value }))}
                      />
                      <p className="mt-1 text-[0.6875rem] text-muted-foreground">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">This endpoint takes no parameters.</p>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="neko-label">
                {endpoint.method === "POST" ? "JSON body sent on execute" : "Query string built from fields"}
              </span>
              <button type="button" onClick={run} disabled={running} className="neko-btn neko-btn-accent">
                <i className={`fa-solid ${running ? "fa-spinner fa-spin" : "fa-play"}`} aria-hidden="true" />
                {running ? "Executing" : "Execute request"}
              </button>
            </div>
          </div>
        </section>

        {running ? (
          <Panel title="Response" icon="fa-reply">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Panel>
        ) : null}

        {error ? (
          <Panel title="Request failed" icon="fa-triangle-exclamation">
            <p className="font-mono text-xs text-danger">{error}</p>
          </Panel>
        ) : null}

        {!running && result ? <ResponseViewer result={result} /> : null}
      </div>
    </div>
  );
}
