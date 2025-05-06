import { config } from "../config/deno.ts";
import { PRIORITIZED_KEY_NAME } from "../constants.ts";
import { buildSchedule } from "../schedule.ts";

const cfg = config();
const schedule = await buildSchedule(fetch);

Deno.writeTextFileSync(
  "static/schedule.json",
  JSON.stringify({
    ...schedule,
    [PRIORITIZED_KEY_NAME]: cfg.schedule.computer_audiences,
  }),
);
