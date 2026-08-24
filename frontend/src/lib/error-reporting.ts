type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type ErrorSink = {
  captureException?: (error: unknown, context?: Record<string, unknown>, options?: ErrorOptions) => void;
};

declare global {
  interface Window {
    /** Optional external error sink (e.g. an APM/telemetry snippet). Safe if absent. */
    __nekoErrorSink?: ErrorSink;
  }
}

/**
 * Reports an error caught by the root error boundary to whatever telemetry
 * sink is wired up (if any). No-op when nothing is configured — this file
 * has no dependency on any external editor or hosting platform.
 */
export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  window.__nekoErrorSink?.captureException?.(
    error,
    { source: "react_error_boundary", route: window.location.pathname, message, ...context },
    { mechanism: "react_error_boundary", handled: false, severity: "error" },
  );
}
