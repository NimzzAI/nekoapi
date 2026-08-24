// Vite config for NekoAPI. Runs on plain, publicly documented TanStack Start
// plugins only — no third-party wrapper package.
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    // Resolves the "@/*" -> "./src/*" alias declared in tsconfig.json.
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). The nitro build target reads from this.
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});

