/**
 * Announcement / promo popup — everything editable in one place.
 *
 * To change the popup shown on the docs page: edit the fields below.
 * Nothing else in the codebase needs to change.
 *
 * Set `enabled: false` to turn the popup off entirely without deleting it.
 */
export type AnnouncementButton = {
  label: string;
  href: string;
  /** Font Awesome icon name without the fa- prefix, e.g. "heart", "whatsapp". */
  icon: string;
  /** Visual style. "primary" = filled accent, "outline" = bordered, "ghost" = text only. */
  tone: "primary" | "outline" | "ghost";
};

export type AnnouncementConfig = {
  enabled: boolean;
  /** Image shown at the top of the popup. Use an absolute URL or a /public path. */
  imageUrl: string;
  imageAlt: string;
  title: string;
  body: string;
  buttons: AnnouncementButton[];
  /** Re-show the popup after this many hours, even if the user dismissed it. 0 = only once per browser. */
  reshowAfterHours: number;
};

export const announcementConfig: AnnouncementConfig = {
  enabled: true,
  imageUrl: "/announcement.jpg",
  imageAlt: "NekoAPI announcement",
  title: "Welcome to NekoAPI",
  body: "Explore the AI, Downloader and Search endpoints, or jump straight into the docs to start building.",
  buttons: [
    { label: "Donate", href: "#", icon: "heart", tone: "outline" },
    { label: "Join community", href: "#", icon: "whatsapp", tone: "primary" },
  ],
  reshowAfterHours: 24,
};
