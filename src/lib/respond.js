const STATUS_FOR = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  UPSTREAM_ERROR: 502,
  INTERNAL: 500,
};

export function ok(res, data, meta = {}) {
  res.status(200).json({ success: true, data, meta });
}

export function fail(res, code, message, details) {
  const status = STATUS_FOR[code] || 500;
  const error = { code, message };
  if (details) error.details = details;
  res.status(status).json({ success: false, error });
}

export { STATUS_FOR };
