import { ok } from "../../lib/respond.js";

export default function (app) {
  app.get("/ping", (req, res) => {
    ok(res, { pong: true, at: new Date().toISOString() });
  });
}
