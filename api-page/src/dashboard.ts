interface StatsData {
  uptimeMs: number;
  requestsPerMinute: number;
  totalRequests: number;
  errorRate: number;
  avgResponseMs: number;
  inFlight: number;
}

interface StatsResponse {
  success: boolean;
  data: StatsData;
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function refresh(): Promise<void> {
  try {
    const res = await fetch("/stats");
    const { data } = (await res.json()) as StatsResponse;
    setText("uptime", fmtUptime(data.uptimeMs));
    setText("rpm", String(data.requestsPerMinute));
    setText("total", String(data.totalRequests));
    setText("errorRate", `${data.errorRate}%`);
    setText("avg", `${data.avgResponseMs}ms`);
    setText("inFlight", String(data.inFlight));
  } catch {
    // silently retry on next tick
  }
}

refresh();
setInterval(refresh, 3000);
