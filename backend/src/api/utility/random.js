const crypto = require("crypto");
const { ok, fail } = require("../../lib/respond");

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function uuidV4() {
  return crypto.randomUUID();
}

module.exports = function (app) {
  app.get("/random", (req, res) => {
    const kind = req.query.type || "uuid";

    if (kind === "uuid") {
      return ok(res, { type: kind, value: uuidV4() });
    }

    if (kind === "int") {
      const min = parseInt(req.query.min ?? "0", 10);
      const max = parseInt(req.query.max ?? "100", 10);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
        return fail(res, "BAD_REQUEST", "min and max must be integers with min < max");
      }
      const value = min + crypto.randomInt(max - min);
      return ok(res, { type: kind, min, max, value });
    }

    if (kind === "bytes" || kind === "string") {
      const length = parseInt(req.query.length ?? "16", 10);
      if (!Number.isInteger(length) || length < 1 || length > 256) {
        return fail(res, "BAD_REQUEST", "length must be an integer between 1 and 256");
      }
      const buf = crypto.randomBytes(length);
      if (kind === "bytes") {
        return ok(res, { type: kind, length, hex: buf.toString("hex") });
      }
      let out = "";
      for (let i = 0; i < length; i++) out += ALPHABET[buf[i] % ALPHABET.length];
      return ok(res, { type: kind, length, value: out });
    }

    return fail(res, "BAD_REQUEST", "type must be one of uuid|int|bytes|string");
  });
};
