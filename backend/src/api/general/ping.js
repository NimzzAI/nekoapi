const { ok } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/ping", (req, res) => {
    ok(res, { pong: true, at: new Date().toISOString() });
  });
};
