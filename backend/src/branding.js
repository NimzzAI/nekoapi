/**
 * Non-secret site metadata. Mirrors frontend/src/config.js so both
 * backends agree on the same name/owner/version without an env var
 * round-trip. Edit the values below directly — nothing here is a secret
 * and nothing here should ever come from process.env.
 */
module.exports = {
  name: "NekoAPI",
  owner: "Nimzz",
  url: "https://api-nekoapi.vercel.app/",
  version: "1.0.0",
};
