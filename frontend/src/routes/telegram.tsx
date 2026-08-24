import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, execute } from "@/lib/api-client";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import { Panel, StatusPill } from "@/components/neko/primitives";
import { JsonViewer } from "@/components/neko/JsonViewer";

export const Route = createFileRoute("/telegram")({
  head: () => ({
    meta: [
      { title: `Telegram connector — ${siteConfig.name}` },
      { name: "description", content: "Status and send console for the NekoAPI Telegram connector: messages, photos, documents and audio via bot token." },
      { property: "og:title", content: `Telegram connector — ${siteConfig.name}` },
      { property: "og:description", content: "Send messages and media through the NekoAPI Telegram connector." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/telegram") }],
  }),
  component: Telegram,
});

type TgStatus = {
  configured: boolean;
  status: string;
  hint?: string;
  bot?: { id: number; username: string; name: string };
  pendingUpdates?: number;
  capabilities: string[];
};

const KINDS = ["message", "photo", "document", "audio"] as const;

function Telegram() {
  const status = useQuery({
    queryKey: ["telegram-status"],
    queryFn: () => apiGet<TgStatus>("/telegram/status"),
    refetchInterval: 15_000,
    retry: 0,
  });

  const [chatId, setChatId] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("message");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await execute("POST", "/telegram/send", {
        body: JSON.stringify({
          chatId,
          kind,
          ...(text ? { text } : {}),
          ...(url ? { url } : {}),
        }),
      });
      setResult(res.json ?? res.text ?? { status: res.status });
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setSending(false);
    }
  };

  const s = status.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="neko-label">Connector</p>
        <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
        <p className="text-sm text-muted-foreground">
          Bot delivery through the backend. The token is read from the{" "}
          <code className="font-mono text-accent">TELEGRAM_BOT_TOKEN</code> environment variable and never reaches the
          browser.
        </p>
      </header>

      <Panel title="Connector status" icon="fa-plug">
        <div className="flex flex-wrap gap-1.5">
          <StatusPill
            tone={s?.configured ? "ok" : "warn"}
            icon="fa-paper-plane"
            label={s ? s.status : status.isLoading ? "checking" : "unreachable"}
          />
          {s?.bot ? <StatusPill tone="info" icon="fa-robot" label={`@${s.bot.username}`} /> : null}
          {s?.configured ? (
            <StatusPill tone="info" icon="fa-inbox" label={`${s.pendingUpdates ?? 0} pending updates`} />
          ) : null}
        </div>
        {s?.hint ? <p className="mt-2 text-sm text-muted-foreground">{s.hint}</p> : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(s?.capabilities ?? KINDS).map((c) => (
            <span key={c} className="neko-chip font-mono">
              {c}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Send" icon="fa-paper-plane">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="neko-label">Chat ID or @username</span>
            <input
              className="neko-input mt-1 w-full font-mono"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="123456789"
            />
          </label>
          <label className="block">
            <span className="neko-label">Kind</span>
            <select
              className="neko-input mt-1 w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-2 block">
          <span className="neko-label">Text / caption</span>
          <textarea
            className="neko-input mt-1 h-24 w-full"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hello from NekoAPI"
          />
        </label>

        {kind !== "message" ? (
          <label className="mt-2 block">
            <span className="neko-label">Media URL (https)</span>
            <input
              className="neko-input mt-1 w-full font-mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.jpg"
            />
          </label>
        ) : null}

        <button
          type="button"
          className="neko-btn neko-btn-accent mt-3"
          onClick={send}
          disabled={sending || !chatId}
        >
          <i className={`fa-solid ${sending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
          {sending ? "Sending" : "Send"}
        </button>
      </Panel>

      {result !== null ? (
        <Panel title="Response" icon="fa-code">
          <JsonViewer value={result} />
        </Panel>
      ) : null}
    </div>
  );
}
