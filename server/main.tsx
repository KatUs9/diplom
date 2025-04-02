import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

app.get("*", serveStatic({ root: "./static" }));

app.get("/", (c) => {
  return c.html(
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="stylesheet"
          href="https://cdn.simplecss.org/simple.min.css"
        />
        <link rel="stylesheet" href="/styles.css" />
        <script type="module" src="/js/bundle.js" />
        <title>Hono</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>,
  );
});

Deno.serve(app.fetch);
