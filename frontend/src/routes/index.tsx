import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { ENDPOINTS, CATEGORIES } from "@/api/core/registry";
import { Metric } from "@/components/neko/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteConfig.name} — ${siteConfig.tagline}` },
      { name: "description", content: siteConfig.description },
      { property: "og:title", content: `${siteConfig.name} — ${siteConfig.tagline}` },
      { property: "og:description", content: siteConfig.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Home,
});

type Stats = { totalRequests: number; requestsPerMinute: number; errorRate: number };
type Status = { api: string };

const categoryIcon: Record<string, string> = {
  AI: "fa-brain",
  Downloader: "fa-download",
  Search: "fa-magnifying-glass",
  General: "fa-circle-info",
  System: "fa-server",
  Media: "fa-image",
  Utility: "fa-toolbox",
  Information: "fa-address-card",
};

function Home() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    refetchInterval: 15_000,
  });
  const status = useQuery({
    queryKey: ["status"],
    queryFn: () => apiGet<Status>("/status"),
    refetchInterval: 15_000,
  });

  const s = hydrated ? stats.data : undefined;
  const uptimePercent = status.isSuccess && status.data.api === "operational" ? "99%" : "—";

  return (
    <div className="space-y-8">
      {/* ---------- Hero ---------- */}
      <section className="neko-grid-bg relative -mx-3 -mt-4 border-b border-border px-3 pb-8 pt-8 text-center sm:-mx-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-accent/50 bg-accent/10 text-accent">
            <i className="fa-solid fa-cat text-2xl" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{siteConfig.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Welcome to {siteConfig.name} documentation.</p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{siteConfig.description}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link to="/endpoints" className="neko-btn neko-btn-accent">
              <i className="fa-solid fa-book" aria-hidden="true" />
              Documentation
            </Link>
            <Link to="/dashboard" className="neko-btn">
              <i className="fa-solid fa-gauge-high" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section className="mx-auto max-w-3xl space-y-3">
        <h2 className="neko-label flex items-center gap-2 !text-foreground">
          <i className="fa-solid fa-circle-info text-accent" aria-hidden="true" />
          About
        </h2>
        <div className="neko-panel overflow-hidden">
          <img
            src={siteConfig.heroImage}
            alt={`${siteConfig.name} illustration`}
            className="h-48 w-full object-cover sm:h-64"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {siteConfig.name} is a free and open API service providing AI, downloader and search endpoints for
              your development needs — backed by a live dashboard, request logs and an interactive explorer so you
              can see exactly what's running before you build on it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="mx-auto max-w-3xl space-y-3">
        <h2 className="neko-label flex items-center gap-2 !text-foreground">
          <i className="fa-solid fa-shapes text-accent" aria-hidden="true" />
          Endpoint categories
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const count = ENDPOINTS.filter((e) => e.category === cat).length;
            return (
              <Link
                key={cat}
                to="/endpoints"
                search={{ category: cat }}
                className="neko-panel flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-accent">
                  <i className={`fa-solid ${categoryIcon[cat] ?? "fa-diagram-project"}`} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{cat}</span>
                  <span className="block text-xs text-muted-foreground">{count} endpoint{count === 1 ? "" : "s"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Statistics ---------- */}
      <section className="mx-auto max-w-3xl space-y-3">
        <h2 className="neko-label flex items-center gap-2 !text-foreground">
          <i className="fa-solid fa-chart-line text-accent" aria-hidden="true" />
          Statistics
        </h2>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Metric
            label="Total requests"
            icon="fa-arrow-right-arrow-left"
            loading={!hydrated || stats.isLoading}
            value={s?.totalRequests ?? 0}
          />
          <Metric label="Uptime" icon="fa-server" loading={!hydrated} value={uptimePercent} />
          <Metric label="Endpoints" icon="fa-diagram-project" loading={false} value={ENDPOINTS.length} />
          <Metric
            label="Error rate"
            icon="fa-triangle-exclamation"
            loading={!hydrated || stats.isLoading}
            value={s?.errorRate ?? 0}
            unit="%"
          />
        </div>
      </section>

      {/* ---------- License & usage ---------- */}
      <section className="mx-auto max-w-3xl">
        <div className="neko-panel space-y-4 p-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <i className="fa-solid fa-scale-balanced text-accent" aria-hidden="true" />
              License
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {siteConfig.name} is licensed under the MIT License. Free to use, modify and distribute for personal
              and commercial purposes.
            </p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <i className="fa-solid fa-code text-accent" aria-hidden="true" />
              Usage policy
            </h3>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Respect the per-endpoint rate limit shown in the docs.</li>
              <li>Do not send abusive or automated flood traffic against the API.</li>
              <li>Repeated abuse may result in your IP being temporarily blocked — see /security.</li>
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <i className="fa-solid fa-heart text-accent" aria-hidden="true" />
              Attribution
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              If you use {siteConfig.name} in a public project, a link back is appreciated but not required.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-3xl border-t border-border pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name} · made by {siteConfig.owner}
      </footer>
    </div>
  );
}
