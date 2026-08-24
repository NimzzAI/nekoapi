import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { EmptyState, MethodBadge, Panel, Skeleton } from "@/components/neko/primitives";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: `Request log — ${siteConfig.name}` },
      { name: "description", content: "Live request log for NekoAPI: method, path, status, latency and masked client network for every call." },
      { property: "og:title", content: `Request log — ${siteConfig.name}` },
      { property: "og:description", content: "Live NekoAPI request log with filtering by method, status and endpoint." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/requests") }],
  }),
  component: Requests,
});

type LogItem = {
  ts: number;
  method: string;
  path: string;
  status: number;
  ms: number;
  ip: string;
  deviceId: string;
};

type LogPage = { total: number; page: number; perPage: number; pages: number; items: LogItem[] };

function tone(status: number) {
  if (status >= 500) return "text-danger";
  if (status >= 400) return "text-warn";
  return "text-ok";
}

function Requests() {
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["logs", method, status, endpoint, page],
    queryFn: () =>
      apiGet<LogPage>("/logs", {
        ...(method ? { method } : {}),
        ...(status ? { status } : {}),
        ...(endpoint ? { endpoint } : {}),
        page: String(page),
        perPage: "25",
      }),
    refetchInterval: 5000,
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="neko-label">Observability</p>
        <h1 className="text-2xl font-semibold tracking-tight">Request log</h1>
        <p className="text-sm text-muted-foreground">
          Every call handled by the API, recorded in memory with masked client networks.
        </p>
      </header>

      <Panel title="Filters" icon="fa-filter">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="neko-label">Method</span>
            <select
              className="neko-input mt-1 w-full"
              value={method}
              onChange={(e) => {
                setPage(1);
                setMethod(e.target.value);
              }}
            >
              <option value="">all</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
          <label className="block">
            <span className="neko-label">Status</span>
            <select
              className="neko-input mt-1 w-full"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">all</option>
              <option value="2xx">2xx</option>
              <option value="4xx">4xx</option>
              <option value="5xx">5xx</option>
              <option value="429">429</option>
            </select>
          </label>
          <label className="block">
            <span className="neko-label">Endpoint contains</span>
            <input
              className="neko-input mt-1 w-full font-mono"
              value={endpoint}
              placeholder="/status"
              onChange={(e) => {
                setPage(1);
                setEndpoint(e.target.value);
              }}
            />
          </label>
        </div>
      </Panel>

      <Panel
        title={`Entries${data ? ` · ${data.total}` : ""}`}
        icon="fa-list-check"
      >
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="fa-inbox" title="No requests recorded" hint="Execute an endpoint from the API Explorer." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left font-mono text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-1.5 pr-3 font-normal">time</th>
                    <th className="py-1.5 pr-3 font-normal">method</th>
                    <th className="py-1.5 pr-3 font-normal">path</th>
                    <th className="py-1.5 pr-3 font-normal">status</th>
                    <th className="py-1.5 pr-3 font-normal">ms</th>
                    <th className="py-1.5 font-normal">network</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((l, i) => (
                    <tr key={`${l.ts}-${i}`} className="border-b border-border/60">
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {new Date(l.ts).toLocaleTimeString()}
                      </td>
                      <td className="py-1.5 pr-3">
                        <MethodBadge method={l.method} />
                      </td>
                      <td className="max-w-[220px] truncate py-1.5 pr-3">{l.path}</td>
                      <td className={`py-1.5 pr-3 ${tone(l.status)}`}>{l.status}</td>
                      <td className="py-1.5 pr-3">{l.ms}</td>
                      <td className="py-1.5 text-muted-foreground">{l.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="neko-btn !min-h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                Prev
              </button>
              <span className="font-mono text-xs text-muted-foreground">
                page {data.page} / {data.pages}
              </span>
              <button
                type="button"
                className="neko-btn !min-h-7 text-xs"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
