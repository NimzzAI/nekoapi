/**
 * Privacy-conscious request fingerprint.
 * Hash of coarse signals + rotating daily salt. No raw IP or UA stored.
 */

const enc = new TextEncoder();

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
    "0.0.0.0"
  ) || "0.0.0.0";
}

export function maskIp(ip: string): string {
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::/48`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "unknown";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function deviceId(req: Request): Promise<string> {
  const h = req.headers;
  const daySalt = Math.floor(Date.now() / 86_400_000).toString();
  const material = [
    clientIp(req),
    h.get("user-agent") ?? "",
    h.get("accept-language") ?? "",
    h.get("sec-ch-ua-platform") ?? "",
    daySalt,
  ].join("|");
  const hex = await sha256Hex(material);
  return `dev_${hex.slice(0, 20)}`;
}

export function coarseClient(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const platform =
    /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Linux/i.test(ua) ? "Linux"
    : "unknown";
  const engine =
    /Firefox\//i.test(ua) ? "Gecko"
    : /Edg\//i.test(ua) ? "Blink (Edge)"
    : /Chrome\//i.test(ua) ? "Blink"
    : /Safari\//i.test(ua) ? "WebKit"
    : "unknown";
  return { platform, engine, formFactor: mobile ? "mobile" : "desktop" };
}
