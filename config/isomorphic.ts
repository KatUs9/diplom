import * as toml from "@std/toml";
import { z } from "zod";

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

export function getConfigPath(os: string) {
  if (os == "windows") {
    return "C:\\\\ProgramData\\Schedule\\config.toml";
  }

  return "/etc/schedule/config.toml";
}

export function isomorphicConfig(filetext: string | null) {
  if (!filetext) {
    return schema.parse({ server: {}, schedule: {} });
  }

  return schema.parse(toml.parse(filetext));
}
