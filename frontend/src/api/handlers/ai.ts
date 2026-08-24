import { ApiError, jsonOk } from "../core/respond";
import type { Ctx } from "../types";

/**
 * AI category. Fetches the free public Siputzx GPT-3 endpoint directly —
 * the same upstream Takanashi's ai-gpt3.js uses, and the same one the Node
 * backend (backend/src/api/ai/chat.js) calls. No provider key, no subprocess.
 */

const TIMEOUT_MS = 15_000;

type SiputzxGPT3Response = { status: boolean; result: string };

export async function chat(ctx: Ctx): Promise<Response> {
  const prompt = ctx.url.searchParams.get("prompt");
  const explicitContent = ctx.url.searchParams.get("content");
  const content = explicitContent || prompt;
  const systemPrompt = explicitContent ? prompt || "You are a helpful assistant." : "You are a helpful assistant.";

  if (!content || !content.trim()) throw new ApiError("BAD_REQUEST", "prompt is required");
  if (content.length > 4000) throw new ApiError("BAD_REQUEST", "prompt must be 4000 characters or fewer");

  const endpoint = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(systemPrompt)}&content=${encodeURIComponent(content)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(endpoint, { signal: controller.signal });
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "the AI provider did not respond");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new ApiError("UPSTREAM_ERROR", "the AI provider did not respond");

  let body: SiputzxGPT3Response;
  try {
    body = (await res.json()) as SiputzxGPT3Response;
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "the AI provider returned malformed data");
  }
  if (!body.status || !body.result) {
    throw new ApiError("UPSTREAM_ERROR", "the AI provider did not return a usable response");
  }

  return jsonOk({ prompt: content, answer: body.result });
}
