import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ENDPOINTS, CATEGORIES, type EndpointCategory } from "@/api/core/registry";
import { siteConfig, absoluteUrl, apiBase } from "@/lib/site-config";
import { CopyButton, MethodBadge, Panel } from "@/components/neko/primitives";
import { AnnouncementPopup } from "@/components/neko/AnnouncementPopup";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const runtimeLabel: Record<string, string> = {
  go: "Go",
  node: "Node",
  php: "PHP",
  python: "Python",
};

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/endpoints")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Docs — ${siteConfig.name}` },
      { name: "description", content: "Full reference for every NekoAPI endpoint: AI, downloader, search and utility routes with parameters, rate limits and example responses." },
      { property: "og:title", content: `Docs — ${siteConfig.name}` },
      { property: "og:description", content: `Full endpoint reference for ${siteConfig.name}.` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/endpoints") }],
  }),
  component: Endpoints,
});

function Endpoints() {
  const { category: initialCategory } = Route.useSearch();
  const [category, setCategory] = useState<EndpointCategory | "all">(
    (initialCategory as EndpointCategory) && CATEGORIES.includes(initialCategory as EndpointCategory)
      ? (initialCategory as EndpointCategory)
      : "all",
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<EndpointCategory, typeof ENDPOINTS>();
    for (const cat of CATEGORIES) map.set(cat, ENDPOINTS.filter((e) => e.category === cat));
    return map;
  }, []);

  const list = category === "all" ? ENDPOINTS : (grouped.get(category) ?? []);
  const active = ENDPOINTS.find((e) => e.id === activeId) ?? list[0];

  return (
    <div className="space-y-4">
      <AnnouncementPopup />

      <header className="space-y-1">
        <p className="neko-label">Reference</p>
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <p className="text-sm text-muted-foreground">
          {ENDPOINTS.length} endpoints served from <code className="font-mono text-accent">{apiBase()}</code>
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* ---------- Sidebar: category accordion ---------- */}
        <aside className="neko-panel h-fit lg:sticky lg:top-16">
          <div className="p-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors ${
                category === "all" ? "bg-accent/10 text-accent" : "hover:bg-surface-2"
              }`}
            >
              <i className="fa-solid fa-layer-group w-4 text-center text-xs" aria-hidden="true" />
              All endpoints
              <span className="ml-auto text-xs text-muted-foreground">{ENDPOINTS.length}</span>
            </button>
          </div>
          <Accordion type="multiple" defaultValue={[...CATEGORIES]} className="px-2 pb-2">
            {CATEGORIES.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <AccordionItem key={cat} value={cat} className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${categoryIcon[cat] ?? "fa-diagram-project"} w-4 text-center text-xs text-accent`} aria-hidden="true" />
                      {cat}
                      <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0">
                    <div className="flex flex-col gap-0.5">
                      {items.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setActiveId(e.id);
                          }}
                          className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors ${
                            active?.id === e.id ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                          }`}
                        >
                          <MethodBadge method={e.method} />
                          <span className="truncate font-mono">{e.path}</span>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </aside>

        {/* ---------- Main: category chips + endpoint grid + detail ---------- */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-1.5 lg:hidden">
            {["all", ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c as EndpointCategory | "all")}
                aria-pressed={category === c}
                className={`neko-chip transition-colors ${category === c ? "!border-accent/60 !bg-accent/10 !text-accent" : "hover:bg-surface-2"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-2.5 md:grid-cols-2">
            {list.map((e) => (
              <button key={e.id} type="button" onClick={() => setActiveId(e.id)} className="text-left">
                <Panel className={active?.id === e.id ? "!border-accent/50" : ""}>
                  <div className="flex items-center gap-2">
                    <MethodBadge method={e.method} />
                    <code className="truncate font-mono text-sm">{e.path}</code>
                    <div className="ml-auto flex items-center gap-1.5">
                      {e.runtime ? (
                        <span className="neko-chip !px-1.5 !py-0 text-[0.625rem]" title={`Implemented in ${runtimeLabel[e.runtime]}`}>
                          {runtimeLabel[e.runtime]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="neko-chip">{e.responseKind}</span>
                    <span className="neko-chip">{e.rateLimit}</span>
                  </div>
                </Panel>
              </button>
            ))}
          </div>

          {active ? (
            <Panel title={active.name} icon={categoryIcon[active.category] ?? "fa-diagram-project"}>
              <div className="flex items-center gap-2">
                <MethodBadge method={active.method} />
                <code className="truncate font-mono text-sm">{apiBase()}{active.path}</code>
                <div className="ml-auto">
                  <CopyButton value={`${apiBase()}${active.path}`} compact title="Copy full URL" />
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{active.description}</p>

              {active.params.length > 0 ? (
                <div className="mt-3">
                  <p className="neko-label">Parameters</p>
                  <div className="mt-1.5 space-y-1.5">
                    {active.params.map((p) => (
                      <div key={p.name} className="flex flex-wrap items-baseline gap-2 border-b border-border/60 pb-1.5 text-xs">
                        <span className="font-mono text-accent">
                          {p.name}
                          {p.required ? <span className="text-danger">*</span> : null}
                        </span>
                        <span className="text-muted-foreground">{p.in} · {p.type}</span>
                        <span className="text-muted-foreground">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {active.errors.map((err) => (
                  <span key={err} className="neko-chip !text-danger">{err}</span>
                ))}
              </div>

              <div className="mt-4">
                <Link to="/explorer" className="neko-btn neko-btn-accent !min-h-8 text-xs">
                  <i className="fa-solid fa-play" aria-hidden="true" />
                  Try it in API Explorer
                </Link>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
