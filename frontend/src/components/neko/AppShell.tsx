import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { siteConfig } from "@/lib/site-config";
import { StatusDot } from "./primitives";

const NAV = [
  { to: "/", label: "Home", icon: "fa-house" },
  { to: "/dashboard", label: "Dashboard", icon: "fa-gauge-high" },
  { to: "/explorer", label: "API Explorer", icon: "fa-terminal" },
  { to: "/endpoints", label: "Docs", icon: "fa-book" },
  { to: "/requests", label: "Requests", icon: "fa-list-check" },
  { to: "/server", label: "Server", icon: "fa-server" },
  { to: "/telegram", label: "Telegram", icon: "fa-paper-plane" },
  { to: "/security", label: "Security", icon: "fa-shield-halved" },
  { to: "/settings", label: "Settings", icon: "fa-sliders" },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("neko-theme");
    const next = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("neko-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  return { theme, toggle };
}

type StatusData = { api: string; telegram: string; uptimeMs: number };

export function useServerStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => apiGet<StatusData>("/status"),
    refetchInterval: 10_000,
    retry: 1,
  });
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-sm border border-transparent px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          activeProps={{
            className:
              "!border-border !bg-surface-2 !text-foreground relative before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:bg-accent",
          }}
          activeOptions={{ exact: item.to === "/" }}
        >
          <i className={`fa-solid ${item.icon} w-4 text-center text-xs`} aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const status = useServerStatus();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const online = status.isSuccess && status.data.api === "operational";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            className="neko-btn !min-h-8 !px-2 md:hidden"
            onClick={() => setDrawer((d) => !d)}
            aria-label={drawer ? "Close navigation" : "Open navigation"}
            aria-expanded={drawer}
          >
            <i className={`fa-solid ${drawer ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-sm border border-accent/50 bg-accent/10 text-accent">
              <i className="fa-solid fa-cat text-xs" aria-hidden="true" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">/ {siteConfig.tagline}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span className="neko-chip" title="Live API status">
              <StatusDot tone={status.isLoading ? "muted" : online ? "ok" : "danger"} live={online} />
              <span className="hidden sm:inline">
                {status.isLoading ? "checking" : online ? "operational" : "unreachable"}
              </span>
            </span>
            <span className="neko-chip hidden lg:inline-flex" title="Project owner">
              <i className="fa-solid fa-user-astronaut text-muted-foreground" aria-hidden="true" />
              {siteConfig.owner}
            </span>
            <button type="button" onClick={toggle} className="neko-btn !min-h-8 !px-2" aria-label="Toggle color theme">
              <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-52 shrink-0 border-r border-border px-2 py-3 md:block">
          <NavLinks />
          <div className="mt-4 border-t border-border px-2.5 pt-3">
            <p className="neko-label">Runtime</p>
            <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
              v{siteConfig.version} · {siteConfig.owner}
            </p>
          </div>
        </aside>

        {drawer ? (
          <div className="fixed inset-0 top-12 z-30 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-background/70"
              aria-label="Close navigation"
              onClick={() => setDrawer(false)}
            />
            <div className="neko-enter absolute left-0 top-0 h-full w-60 border-r border-border bg-surface p-2">
              <NavLinks onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-5">{children}</main>
      </div>
    </div>
  );
}
