import { useEffect, useState } from "react";
import { announcementConfig } from "@/lib/announcement-config";

const STORAGE_KEY = "neko-announcement-dismissed-at";

const toneClass: Record<string, string> = {
  primary: "neko-btn neko-btn-accent",
  outline: "neko-btn",
  ghost: "neko-btn !border-transparent !bg-transparent",
};

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!announcementConfig.enabled) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setOpen(true);
      return;
    }
    const dismissedAt = Number(stored);
    const hours = announcementConfig.reshowAfterHours;
    if (hours > 0 && Date.now() - dismissedAt > hours * 3600_000) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  if (!announcementConfig.enabled || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="neko-enter relative w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close announcement"
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background"
        >
          <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
        </button>

        {announcementConfig.imageUrl ? (
          <img
            src={announcementConfig.imageUrl}
            alt={announcementConfig.imageAlt}
            className="h-44 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        <div className="p-4">
          <h2 className="text-base font-semibold tracking-tight">{announcementConfig.title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{announcementConfig.body}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {announcementConfig.buttons.map((btn) => (
              <a
                key={btn.label}
                href={btn.href}
                target={btn.href.startsWith("http") ? "_blank" : undefined}
                rel={btn.href.startsWith("http") ? "noreferrer" : undefined}
                className={toneClass[btn.tone] ?? "neko-btn"}
              >
                <i className={`fa-solid fa-${btn.icon}`} aria-hidden="true" />
                {btn.label}
              </a>
            ))}
            <button type="button" onClick={close} className="neko-btn ml-auto">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
