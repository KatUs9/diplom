import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import schedule from "../static/schedule.json" with { type: "json" };
import { HTTPException } from "hono/http-exception";
import type { Lesson } from "../schedule.ts";

type Schedule = typeof schedule;
type Building = keyof Schedule;

export const api = new Hono().get(
  "/schedule",
  zValidator(
    "query",
    z.object({
      audience: z.string(),
      building: z.string(),
    }),
  ),
  (c) => {
    const { audience, building } = c.req.valid("query");

    if (
      !(building in schedule) ||
      !(audience in schedule[building as Building])
    ) {
      throw new HTTPException(404);
    }

    // @ts-ignore easier to ignore the error than to bother with types
    const lessons = schedule[building][audience] as Lesson[][];

    return c.json(
      lessons,
      200,
    );
  },
);

export type Api = typeof api;
