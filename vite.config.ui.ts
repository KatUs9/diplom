import deno from "@deno/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(() => ({
  plugins: [deno()],
  esbuild: {
    jsx: "automatic" as const,
    jsxImportSource: "hono/jsx/dom",
  },
  define: {
    "__ENV__": JSON.stringify("web"),
  },
  build: {
    rollupOptions: {
      input: "./ui/main.tsx",
      output: {
        entryFileNames: "bundle.js",
        dir: "./static/js",
      },
    },
  },
}));
