/**
 * NekoAPI — in-memory runtime state (metrics, request log, rate-limit buckets).
 * Values are measured, never fabricated. On the edge runtime this state is
 * per-instance; the Node backend (see /backend) persists the same shape.
 */

export type LogEntry = {
  id: string;
  ts: number;
  method: string;
  path: string;
  ip: string;
  deviceId: string;
  status: number;
  ms: number;
  apiKey: string | null;
};

export type Sample = { ts: number; requests: number; errors: number; avgMs: number };

const MAX_LOGS = 500;
const MAX_SAMPLES = 60;

type State = {
  bootedAt: number;
  totalRequests: number;
  totalErrors: number;
  inFlight: number;
  durations: number[];
  logs: LogEntry[];
  samples: Sample[];
  window: { requests: number; errors: number; ms: number; startedAt: number };
  buckets: Map<string, { count: number; resetAt: number; blockedUntil: number }>;
  perEndpoint: Map<string, { count: number; errors: number; totalMs: number }>;
  devices: Map<string, { count: number; firstSeen: number; lastSeen: number; suspicious: number }>;
};

const g = globalThis as unknown as { __nekoState?: State };

export function state(): State {
  if (!g.__nekoState) {
    g.__nekoState = {
      bootedAt: Date.now(),
      totalRequests: 0,
      totalErrors: 0,
      inFlight: 0,
      durations: [],
      logs: [],
      samples: [],
      window: { requests: 0, errors: 0, ms: 0, startedAt: Date.now() },
      buckets: new Map(),
      perEndpoint: new Map(),
      devices: new Map(),
    };
  }
  return g.__nekoState;
}

export function rollSamples() {
  const s = state();
  const now = Date.now();
  // one sample per 5s bucket
  while (now - s.window.startedAt >= 5000) {
    s.samples.push({
      ts: s.window.startedAt + 5000,
      requests: s.window.requests,
      errors: s.window.errors,
      avgMs: s.window.requests ? Math.round(s.window.ms / s.window.requests) : 0,
    });
    if (s.samples.length > MAX_SAMPLES) s.samples.shift();
    s.window = { requests: 0, errors: 0, ms: 0, startedAt: s.window.startedAt + 5000 };
  }
}

export function record(entry: LogEntry) {
  const s = state();
  rollSamples();
  s.totalRequests += 1;
  if (entry.status >= 400) s.totalErrors += 1;
  s.window.requests += 1;
  s.window.ms += entry.ms;
  if (entry.status >= 400) s.window.errors += 1;

  s.durations.push(entry.ms);
  if (s.durations.length > 1000) s.durations.shift();

  s.logs.unshift(entry);
  if (s.logs.length > MAX_LOGS) s.logs.pop();

  const ep = s.perEndpoint.get(entry.path) ?? { count: 0, errors: 0, totalMs: 0 };
  ep.count += 1;
  ep.totalMs += entry.ms;
  if (entry.status >= 400) ep.errors += 1;
  s.perEndpoint.set(entry.path, ep);

  const dev = s.devices.get(entry.deviceId) ?? {
    count: 0,
    firstSeen: entry.ts,
    lastSeen: entry.ts,
    suspicious: 0,
  };
  dev.count += 1;
  dev.lastSeen = entry.ts;
  if (entry.status === 429) dev.suspicious += 1;
  s.devices.set(entry.deviceId, dev);
  if (s.devices.size > 2000) s.devices.delete(s.devices.keys().next().value as string);
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] ?? 0);
}

export function snapshot() {
  const s = state();
  rollSamples();
  const recent = s.samples.slice(-12);
  const reqLastMin = recent.reduce((a, b) => a + b.requests, 0);
  return {
    bootedAt: s.bootedAt,
    uptimeMs: Date.now() - s.bootedAt,
    totalRequests: s.totalRequests,
    totalErrors: s.totalErrors,
    inFlight: s.inFlight,
    requestsPerMinute: reqLastMin,
    errorRate: s.totalRequests ? +((s.totalErrors / s.totalRequests) * 100).toFixed(2) : 0,
    avgResponseMs: s.durations.length
      ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length)
      : 0,
    p95ResponseMs: percentile(s.durations, 95),
    samples: s.samples,
    knownDevices: s.devices.size,
  };
}
