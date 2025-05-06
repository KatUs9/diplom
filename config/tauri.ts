import { getConfigPath, isomorphicConfig } from "./isomorphic.ts";
import { platform } from "@tauri-apps/plugin-os";
import { readTextFile } from "@tauri-apps/plugin-fs";

export async function config() {
  return isomorphicConfig(await readFile());
}

export async function readFile() {
  try {
    return await readTextFile(getConfigPath(platform()));
  } catch (e) {
    console.warn(e);
    return null;
  }
}
