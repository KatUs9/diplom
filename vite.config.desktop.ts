import deno from "@deno/vite-plugin";
import { defineConfig } from "vite";
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [deno()],
  esbuild: {
    jsx: "automatic" as const,
    jsxImportSource: "hono/jsx/dom",
  },
  define: {
    "__ENV__": JSON.stringify("desktop"),
  },
  publicDir: "./static",
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
