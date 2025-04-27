import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import schedule from "../static/schedule.json" with { type: "json" };
import { api } from "./api.ts";
import { getAudiences } from "../audiences.ts";

const app = new Hono();

app.route("/api", api);

app.get("*", serveStatic({ root: "./static" }));

app.get("/", (c) => {
  const audiences = getAudiences(schedule);

  return c.html(
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/css/reset.css" />
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="manifest" href="/web-manifest.json" />
        <script type="module" src="/js/bundle.js" />
        <title>Hono</title>
      </head>
      <body>
        <script
          id="__AUDIENCES__"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(audiences) }}
        />
        <div id="root"></div>
      </body>
    </html>,
  );
});

Deno.serve(app.fetch);
