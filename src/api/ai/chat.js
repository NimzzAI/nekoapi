import { getJSON } from "../../lib/http.js";
import { ok, fail } from "../../lib/respond.js";

export default function (app) {
  app.get("/ai/chat", async (req, res) => {
    const explicitContent = req.query.content;
    const prompt = req.query.prompt;
    const content = explicitContent || prompt;
    const systemPrompt = explicitContent ? prompt || "You are a helpful assistant." : "You are a helpful assistant.";

    if (!content || !String(content).trim()) return fail(res, "BAD_REQUEST", "prompt is required");
    if (String(content).length > 4000) return fail(res, "BAD_REQUEST", "prompt must be 4000 characters or fewer");

    try {
      const body = await getJSON("https://api.siputzx.my.id/api/ai/gpt3", {
        params: { prompt: systemPrompt, content },
      });
      if (!body.status || !body.result) {
        return fail(res, "UPSTREAM_ERROR", "the AI provider did not return a usable response");
      }
      ok(res, { prompt: content, answer: body.result });
    } catch {
      fail(res, "UPSTREAM_ERROR", "the AI provider did not respond");
    }
  });
}
