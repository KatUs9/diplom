import { getConfigPath, isomorphicConfig } from "./isomorphic.ts";

export function config() {
  return isomorphicConfig(readFile());
}

function readFile() {
  try {
    return Deno.readTextFileSync(getConfigPath(Deno.build.os));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return null;
    }

    throw e;
  }
}
