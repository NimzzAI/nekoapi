/**
 * Dynamic Route Loader
 * ---------------------------------------------------------
 * Scan src/api/<kategori>/*.js secara flat (tanpa folder per-endpoint),
 * require() tiap file, panggil sebagai function(app), dan sekaligus
 * ekstrak method+path routenya (regex ringan) buat membangun manifest
 * yang dipakai halaman /docs dan /dashboard lewat endpoint /api/list.
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const ROUTE_REGEX = /app\.(get|post|put|delete)\(\s*["'`]([^"'`]+)["'`]/g;

function extractRoutes(fileContent) {
  const found = [];
  let match;
  ROUTE_REGEX.lastIndex = 0;
  while ((match = ROUTE_REGEX.exec(fileContent)) !== null) {
    found.push({ method: match[1].toUpperCase(), path: match[2] });
  }
  return found;
}

function loadRoutes(app, apiFolder) {
  const manifest = [];
  let totalRoutes = 0;

  if (!fs.existsSync(apiFolder)) return { manifest, totalRoutes };

  const categories = fs.readdirSync(apiFolder).filter((f) =>
    fs.statSync(path.join(apiFolder, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryPath = path.join(apiFolder, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const routes = extractRoutes(content);

        const mod = require(filePath);
        if (typeof mod === "function") mod(app);

        routes.forEach((r) => {
          manifest.push({ ...r, category, file });
        });

        totalRoutes++;
        console.log(chalk.bgYellow.black(` Loaded: ${category}/${file} `) + chalk.gray(` (${routes.length} route)`));
      } catch (err) {
        console.error(chalk.red(`[routeLoader] Gagal load ${category}/${file}: ${err.message}`));
      }
    }
  }

  return { manifest, totalRoutes };
}

module.exports = { loadRoutes, extractRoutes };
