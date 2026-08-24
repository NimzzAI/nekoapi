import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { EmptyState, Metric, Panel, StatusPill } from "@/components/neko/primitives";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: `Security — ${siteConfig.name}` },
      { name: "description", content: "NekoAPI security posture: rate limit windows, blocked identities, device fingerprint activity and active protection controls." },
      { property: "og:title", content: `Security — ${siteConfig.name}` },
      { property: "og:description", content: "Rate limiting, IP masking and fingerprint telemetry for NekoAPI." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/security") }],
  }),
  component: Security,
});

type Limit = { windowMs: number; max: number };

type SecurityData = {
  limits: { default: Limit; perEndpoint: Record<string, Limit> };
  activeBuckets: number;
  blockedIdentities: number;
  throttledIdentities: number;
  knownDevices: number;
  rateLimited: number;
  suspicious: { deviceId: string; requests: number; rateLimitHits: number; lastSeen: string }[];
  controls: { name: string; detail: string; enabled: boolean }[];
};

function Security() {
  const query = useQuery({
    queryKey: ["security"],
    queryFn: () => apiGet<SecurityData>("/security"),
    refetchInterval: 10_000,
  });

  const d = query.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="neko-label">Protection</p>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">
          Rate limiting, abuse detection and privacy-preserving client fingerprinting, reported live from the API.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <Metric label="Active buckets" icon="fa-bucket" loading={query.isLoading} value={d?.activeBuckets ?? 0} />
        <Metric label="Blocked" icon="fa-ban" loading={query.isLoading} value={d?.blockedIdentities ?? 0} />
        <Metric label="Throttled" icon="fa-gauge" loading={query.isLoading} value={d?.throttledIdentities ?? 0} />
        <Metric label="Known devices" icon="fa-fingerprint" loading={query.isLoading} value={d?.knownDevices ?? 0} />
        <Metric label="429 responses" icon="fa-triangle-exclamation" loading={query.isLoading} value={d?.rateLimited ?? 0} />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <Panel title="Active controls" icon="fa-shield-halved">
          <ul className="space-y-2">
            {(d?.controls ?? []).map((c) => (
              <li key={c.name} className="flex gap-2.5 border-b border-border/60 pb-2 last:border-0">
                <i
                  className={`fa-solid ${c.enabled ? "fa-circle-check text-ok" : "fa-circle-xmark text-muted-foreground"} mt-0.5 text-xs`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-2.5">
          <Panel title="Rate limits" icon="fa-stopwatch">
            <dl className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                <dt className="text-muted-foreground">default</dt>
                <dd>
                  {d ? `${d.limits.default.max} / ${Math.round(d.limits.default.windowMs / 1000)}s` : "…"}
                </dd>
              </div>
              {Object.entries(d?.limits.perEndpoint ?? {}).map(([path, l]) => (
                <div key={path} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                  <dt className="truncate text-muted-foreground">{path}</dt>
                  <dd>
                    {l.max} / {Math.round(l.windowMs / 1000)}s
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Suspicious identities" icon="fa-user-secret">
            {d && d.suspicious.length > 0 ? (
              <ul className="space-y-1.5 font-mono text-xs">
                {d.suspicious.map((x) => (
                  <li key={x.deviceId} className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
                    <span className="truncate">{x.deviceId.slice(0, 16)}…</span>
                    <StatusPill tone="warn" icon="fa-triangle-exclamation" label={`${x.rateLimitHits} hits`} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="fa-shield-cat" title="No abuse detected" hint="No identity has exceeded its rate limit." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
