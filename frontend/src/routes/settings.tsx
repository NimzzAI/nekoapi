import { createFileRoute } from "@tanstack/react-router";
import { siteConfig, absoluteUrl, apiBase } from "@/lib/site-config";
import { CopyButton, Panel } from "@/components/neko/primitives";
import { ENDPOINTS } from "@/api/core/registry";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: `Settings — ${siteConfig.name}` },
      { name: "description", content: "Deployment configuration for NekoAPI: API base URL, environment variables and connector requirements." },
      { property: "og:title", content: `Settings — ${siteConfig.name}` },
      { property: "og:description", content: "Environment variables and deployment configuration for NekoAPI." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/settings") }],
  }),
  component: Settings,
});

const ENV_VARS = [
  {
    name: "VITE_API_BASE_URL",
    scope: "frontend",
    detail: "Point the dashboard at an external Node backend. Empty means the bundled API on this origin.",
  },
  {
    name: "TELEGRAM_BOT_TOKEN",
    scope: "backend",
    detail: "Bot token for the Telegram connector. Never exposed to the browser.",
  },
  { name: "ALLOWED_ORIGINS", scope: "backend", detail: "Comma-separated CORS allowlist for cross-origin API clients." },
  { name: "DATABASE_URL", scope: "backend", detail: "Optional persistent store connection string." },
  { name: "API_SECRET", scope: "backend", detail: "Optional shared secret for privileged internal routes." },
] as const;

const BRANDING_FIELDS = [
  ["name", "Display name used across the interface and metadata."],
  ["tagline", "Short tagline shown under the name."],
  ["description", "Long description used for meta tags and the homepage About section."],
  ["owner", "Shown in the status panel and the site footer."],
  ["url", "Canonical origin used for canonical and Open Graph tags."],
  ["favicon", "Path under /public to the favicon."],
  ["heroImage", "Homepage About illustration. Hidden automatically if the file is missing."],
] as const;

function Settings() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="neko-label">Configuration</p>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Runtime configuration is environment-driven — nothing here is stored in the browser.
        </p>
      </header>

      <Panel title="Current runtime" icon="fa-circle-info">
        <dl className="space-y-1.5 font-mono text-xs">
          {[
            ["platform", siteConfig.name],
            ["version", siteConfig.version],
            ["owner", siteConfig.owner],
            ["api base", apiBase()],
            ["endpoints", String(ENDPOINTS.length)],
            ["mode", siteConfig.apiBaseUrl ? "external backend" : "bundled backend"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate">{v}</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-3">
          <CopyButton value={apiBase()} title="Copy API base URL" />
        </div>
      </Panel>

      <Panel title="Branding — frontend/src/config.js" icon="fa-palette">
        <p className="text-xs text-muted-foreground">
          Not a secret, so it's a plain file instead of an env var. Edit it directly and redeploy — no env var
          round-trip needed. The Node backend has an equivalent at{" "}
          <code className="font-mono text-accent">backend/src/branding.js</code>.
        </p>
        <dl className="mt-2.5 space-y-1.5 font-mono text-xs">
          {BRANDING_FIELDS.map(([key, detail]) => (
            <div key={key} className="border-b border-border/60 pb-1.5">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-accent">{key}</dt>
                <dd className="truncate text-muted-foreground">{String(siteConfig[key as keyof typeof siteConfig])}</dd>
              </div>
              <p className="mt-0.5 font-sans text-[0.6875rem] text-muted-foreground">{detail}</p>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Environment variables" icon="fa-key">
        <ul className="space-y-2">
          {ENV_VARS.map((v) => (
            <li key={v.name} className="border-b border-border/60 pb-2 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm text-accent">{v.name}</code>
                <span className="neko-chip">{v.scope}</span>
                <div className="ml-auto">
                  <CopyButton value={v.name} compact title={`Copy ${v.name}`} />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{v.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
