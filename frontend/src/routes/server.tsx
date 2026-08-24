import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet, formatBytes, formatDuration } from "@/lib/api-client";
import { siteConfig, absoluteUrl, apiBase } from "@/lib/site-config";
import { Bar, Metric, Panel, StatusPill } from "@/components/neko/primitives";

export const Route = createFileRoute("/server")({
  head: () => ({
    meta: [
      { title: `Server — ${siteConfig.name}` },
      { name: "description", content: "Runtime and host metrics for the NekoAPI backend: uptime, memory, region, and per-service health." },
      { property: "og:title", content: `Server — ${siteConfig.name}` },
      { property: "og:description", content: "Runtime, memory and service health for the NekoAPI backend." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/server") }],
  }),
  component: Server,
});

type SystemData = {
  runtime: string;
  os: string | null;
  location: string | null;
  region: string | null;
  uptimeMs: number;
  cpu: number | null;
  memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number } | null;
  storage: { usedBytes: number; totalBytes: number } | null;
  services: Record<string, string>;
};

function Server() {
  const system = useQuery({
    queryKey: ["system"],
    queryFn: () => apiGet<SystemData>("/system"),
    refetchInterval: 5000,
  });

  const d = system.data;
  const heapPercent =
    d?.memory && d.memory.heapTotalBytes > 0
      ? Math.round((d.memory.heapUsedBytes / d.memory.heapTotalBytes) * 100)
      : null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="neko-label">Infrastructure</p>
        <h1 className="text-2xl font-semibold tracking-tight">Server</h1>
        <p className="text-sm text-muted-foreground">
          Measured from <code className="font-mono text-accent">{apiBase()}/system</code>. Values the runtime does not
          expose are reported as unavailable rather than estimated.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Metric label="Uptime" icon="fa-clock" loading={system.isLoading} value={d ? formatDuration(d.uptimeMs) : "—"} />
        <Metric label="Runtime" icon="fa-microchip" loading={system.isLoading} value={d?.runtime ?? "—"} />
        <Metric label="Region" icon="fa-earth-americas" loading={system.isLoading} value={d?.region ?? "n/a"} hint={d?.location ?? undefined} />
        <Metric
          label="Heap used"
          icon="fa-memory"
          loading={system.isLoading}
          value={d?.memory ? formatBytes(d.memory.heapUsedBytes) : "n/a"}
          hint={d?.memory ? `rss ${formatBytes(d.memory.rssBytes)}` : "not exposed by runtime"}
        />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <Panel title="Resources" icon="fa-gauge-high">
          <div className="space-y-3">
            <Bar label="CPU" percent={d?.cpu ?? null} />
            <Bar label="Heap" percent={heapPercent} tone={heapPercent !== null && heapPercent > 85 ? "warn" : "ok"} />
            <Bar
              label="Storage"
              percent={
                d?.storage && d.storage.totalBytes > 0
                  ? Math.round((d.storage.usedBytes / d.storage.totalBytes) * 100)
                  : null
              }
            />
          </div>
          <p className="mt-3 text-[0.6875rem] text-muted-foreground">
            Host CPU and disk are only available when the API runs on the Node backend. On the edge runtime they stay
            unavailable instead of being faked.
          </p>
        </Panel>

        <Panel title="Services" icon="fa-heart-pulse">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(d?.services ?? {}).map(([name, value]) => (
              <StatusPill
                key={name}
                tone={value === "up" ? "ok" : value === "disabled" ? "warn" : "danger"}
                label={`${name} ${value}`}
              />
            ))}
            {!d ? <span className="text-sm text-muted-foreground">Loading service health…</span> : null}
          </div>

          <dl className="mt-4 space-y-1.5 font-mono text-xs">
            {[
              ["os", d?.os ?? "n/a"],
              ["colo", d?.location ?? "n/a"],
              ["owner", siteConfig.owner],
              ["version", siteConfig.version],
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
