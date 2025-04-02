import deno from "@deno/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(() => ({
  plugins: [deno()],
  esbuild: {
    jsx: "automatic" as const,
    jsxImportSource: "hono/jsx/dom",
  },
  build: {
    rollupOptions: {
      input: "./client/app.tsx",
      output: {
        entryFileNames: "bundle.js",
        dir: "./static/js",
      },
    },
  },
}));
