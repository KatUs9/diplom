import { PRIORITIZED_KEY_NAME } from "./constants.ts";
import type { Lesson } from "./scripts/build-schedule.ts";

export function getAudiences(
  schedule: {
    [x: string]: string[] | Record<string, (Lesson[] | null)[]>;
  },
) {
  return Object.keys(schedule).reduce((acc, b) => {
    if (b != PRIORITIZED_KEY_NAME) {
      acc[b] = Object.keys(schedule[b as keyof typeof schedule]);
    }

    return acc;
  }, {} as Record<string, string[]>);
}
