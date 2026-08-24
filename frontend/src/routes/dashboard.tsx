import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, formatDuration } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { ENDPOINTS } from "@/api/core/registry";
import { Metric, Panel, Sparkline, StatusPill } from "@/components/neko/primitives";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: `Dashboard — ${siteConfig.name}` },
      { name: "description", content: "Live server dashboard for NekoAPI: uptime, request volume, latency and endpoint counters." },
      { property: "og:title", content: `Dashboard — ${siteConfig.name}` },
      { property: "og:description", content: "Live NekoAPI server dashboard." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/dashboard") }],
  }),
  component: Dashboard,
});

type Stats = {
  uptimeMs: number;
  totalRequests: number;
  requestsPerMinute: number;
  errorRate: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  endpoints: number;
  samples: { ts: number; requests: number; errors: number; avgMs: number }[];
};

type Status = { api: string; telegram: string; database: string; version: string; startedAt: string };

function Dashboard() {
  // Live counters differ between the SSR render and the first client render,
  // so hold the neutral state until hydration completes.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    refetchInterval: 5000,
  });
  const status = useQuery({
    queryKey: ["status"],
    queryFn: () => apiGet<Status>("/status"),
    refetchInterval: 10_000,
  });

  const st = hydrated ? status.data : undefined;
  const s = hydrated ? stats.data : undefined;
  const loading = !hydrated || stats.isLoading;

  return (
    <div className="space-y-5">
      <section className="neko-grid-bg relative -mx-3 -mt-4 border-b border-border px-3 pb-6 pt-8 sm:-mx-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="neko-label flex items-center gap-2">
            <i className="fa-solid fa-gauge-high text-accent" aria-hidden="true" />
            Live dashboard · owner {siteConfig.owner}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
            <span className="ml-2 font-mono text-base text-muted-foreground">v{siteConfig.version}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Real-time counters sampled straight from the running backend — no synthetic data.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/explorer" className="neko-btn neko-btn-accent">
              <i className="fa-solid fa-terminal" aria-hidden="true" />
              Open API Explorer
            </Link>
            <Link to="/endpoints" className="neko-btn">
              <i className="fa-solid fa-book" aria-hidden="true" />
              Documentation
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <StatusPill
              tone={!hydrated ? "muted" : status.isSuccess ? "ok" : status.isLoading ? "muted" : "danger"}
              label={!hydrated ? "checking" : status.isSuccess ? "API operational" : status.isLoading ? "checking" : "API unreachable"}
              live={hydrated && status.isSuccess}
            />
            <StatusPill
              tone={st?.telegram === "configured" ? "ok" : "warn"}
              icon="fa-paper-plane"
              label={`Telegram ${st?.telegram ?? "…"}`}
            />
            <StatusPill tone="info" icon="fa-database" label={st?.database ?? "database"} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label="Uptime" icon="fa-clock" loading={loading} value={s ? formatDuration(s.uptimeMs) : "—"} />
        <Metric label="Response" icon="fa-bolt" loading={loading} value={s?.avgResponseMs ?? 0} unit="ms avg" hint={s ? `p95 ${s.p95ResponseMs}ms` : undefined} />
        <Metric label="Total requests" icon="fa-arrow-right-arrow-left" loading={loading} value={s?.totalRequests ?? 0} />
        <Metric label="Req / min" icon="fa-wave-square" loading={loading} value={s?.requestsPerMinute ?? 0} />
        <Metric label="Error rate" icon="fa-triangle-exclamation" loading={loading} value={s?.errorRate ?? 0} unit="%" />
        <Metric label="Endpoints" icon="fa-diagram-project" loading={loading} value={ENDPOINTS.length} hint="live catalog" />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        <Panel title="Requests / 5s" icon="fa-chart-column" className="lg:col-span-2">
          <Sparkline values={(s?.samples ?? []).map((x) => x.requests)} label="requests" height={90} />
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">
            Sampled from the live backend counter — no synthetic data.
          </p>
        </Panel>
        <Panel title="System" icon="fa-server">
          <dl className="space-y-1.5 font-mono text-xs">
            {[
              ["service", st?.api ?? "…"],
              ["version", st?.version ?? "…"],
              ["started", st ? new Date(st.startedAt).toLocaleString() : "…"],
              ["owner", siteConfig.owner],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
