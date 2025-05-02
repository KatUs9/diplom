import * as toml from "@std/toml";
import { z } from "zod";

const path = Deno.build.os == "windows"
  ? "C:\\\\ProgramData\\Schedule\\config.toml"
  : "/etc/schedule/config.toml";

const schema = z.object({
  server: z.object({
    port: z.number().default(8000),
  }),
  schedule: z.object({
    computer_audiences: z.array(z.string()).default([
      "У 414",
      "У 415",
      "У 416",
      "У 435",
      "У 439",
      "Конгресс-Центр 316",
    ]),
  }),
});

function read() {
  try {
    return schema.parse(toml.parse(Deno.readTextFileSync(path)));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound || e instanceof z.ZodError) {
      return schema.parse({ server: {}, schedule: {} });
    }

    throw e;
  }
}

export const cfg = read();
