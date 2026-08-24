const crypto = require("crypto");
const { fail } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/image/avatar", (req, res) => {
    let seed = (req.query.seed || "").toString().trim();
    if (!seed) seed = "neko";
    if (seed.length > 64) return fail(res, "BAD_REQUEST", "seed must be at most 64 characters");

    let size = 256;
    if (req.query.size) {
      const v = parseInt(req.query.size, 10);
      if (!Number.isInteger(v) || v < 32 || v > 512) {
        return fail(res, "BAD_REQUEST", "size must be an integer between 32 and 512");
      }
      size = v;
    }

    const sum = crypto.createHash("sha256").update(seed).digest();
    const hue = Math.floor((sum[0] * 360) / 256);
    const cell = Math.floor(size / 5);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="identicon for ${seed}">`;
    svg += `<rect width="${size}" height="${size}" fill="hsl(${hue} 18% 12%)"/>`;
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 5; y++) {
        if (sum[(x * 5 + y) % sum.length] % 2 === 0) continue;
        const light = 45 + (sum[(x + y) % sum.length] % 25);
        for (const cx of [x, 4 - x]) {
          svg += `<rect x="${cx * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="hsl(${hue} 70% ${light}%)"/>`;
        }
      }
    }
    svg += "</svg>";

    res.setHeader("content-type", "image/svg+xml; charset=utf-8");
    res.setHeader("cache-control", "public, max-age=86400");
    res.send(svg);
  });
};
