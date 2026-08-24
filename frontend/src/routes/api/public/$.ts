import { createFileRoute } from "@tanstack/react-router";
import { handleApi } from "@/api/router";

const dispatch = async ({ request, params }: { request: Request; params: { _splat?: string } }) =>
  handleApi(request, params._splat ?? "");

export const Route = createFileRoute("/api/public/$")({
  server: {
    handlers: {
      GET: dispatch,
      POST: dispatch,
      OPTIONS: dispatch,
    },
  },
});
