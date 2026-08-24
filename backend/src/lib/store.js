/**
 * In-memory store backing /stats, /logs, /security and /status. Zero setup,
 * mirrors the old Go backend's internal/store/store.go so the dashboard's
 * data shape is unchanged. Swap for a real database by keeping the same
 * method names.
 */

const MAX_LOGS = 500;

class MemoryStore {
  constructor() {
    this.bootedAt = Date.now();
    this.logs = [];
    this.devices = new Map();
    this.endpoints = new Map();
    this.durations = [];
    this.inFlight = 0;
  }

  incr(delta) {
    this.inFlight = Math.max(0, this.inFlight + delta);
  }

  record(entry) {
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) this.logs.length = MAX_LOGS;

    let d = this.devices.get(entry.deviceId);
    if (!d) {
      d = { requests: 0, firstSeen: entry.ts, lastSeen: entry.ts, rateLimitHits: 0 };
      this.devices.set(entry.deviceId, d);
    }
    d.requests++;
    d.lastSeen = entry.ts;
    if (entry.status === 429) d.rateLimitHits++;

    let s = this.endpoints.get(entry.path);
    if (!s) {
      s = { path: entry.path, count: 0, errors: 0, totalMs: 0 };
      this.endpoints.set(entry.path, s);
    }
    s.count++;
    s.totalMs += entry.ms;
    if (entry.status >= 400) s.errors++;

    this.durations.push(entry.ms);
    if (this.durations.length > MAX_LOGS) this.durations = this.durations.slice(-MAX_LOGS);
  }

  markSuspicious(deviceId) {
    let d = this.devices.get(deviceId);
    if (!d) {
      d = { requests: 0, firstSeen: Date.now(), lastSeen: Date.now(), rateLimitHits: 0 };
      this.devices.set(deviceId, d);
    }
    d.rateLimitHits++;
  }

  getLogs() {
    return [...this.logs];
  }

  getDevices() {
    return Object.fromEntries(this.devices);
  }

  getEndpoints() {
    const out = [];
    for (const s of this.endpoints.values()) {
      const avgMs = s.count > 0 ? Math.round(s.totalMs / s.count) : 0;
      out.push({ path: s.path, count: s.count, errors: s.errors, avgMs });
    }
    out.sort((a, b) => b.count - a.count);
    return out;
  }

  snapshot() {
    const now = Date.now();
    let total = 0;
    let errors = 0;
    for (const s of this.endpoints.values()) {
      total += s.count;
      errors += s.errors;
    }

    let avg = 0;
    let p95 = 0;
    if (this.durations.length > 0) {
      const sorted = [...this.durations].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      avg = Math.round(sum / sorted.length);
      const idx = Math.min(sorted.length - 1, Math.floor((sorted.length * 95) / 100));
      p95 = sorted[idx];
    }

    let rpm = 0;
    for (const l of this.logs) {
      if (now - l.ts <= 60_000) rpm++;
    }

    // 12 buckets of 5 seconds — real counters, never synthetic values.
    const samples = [];
    for (let i = 11; i >= 0; i--) {
      const from = now - (i + 1) * 5000;
      const to = now - i * 5000;
      let count = 0;
      let errs = 0;
      let sum = 0;
      for (const l of this.logs) {
        if (l.ts > from && l.ts <= to) {
          count++;
          sum += l.ms;
          if (l.status >= 400) errs++;
        }
      }
      samples.push({ ts: to, requests: count, errors: errs, avgMs: count > 0 ? Math.round(sum / count) : 0 });
    }

    const errorRate = total > 0 ? Math.round((errors / total) * 10000) / 100 : 0;

    return {
      uptimeMs: now - this.bootedAt,
      totalRequests: total,
      totalErrors: errors,
      requestsPerMinute: rpm,
      errorRate,
      avgResponseMs: avg,
      p95ResponseMs: p95,
      inFlight: this.inFlight,
      samples,
    };
  }
}

module.exports = { MemoryStore };
