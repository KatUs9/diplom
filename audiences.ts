import { COMPUTER_ICON, PRIORITIZED_KEY_NAME } from "./constants.ts";
import type { Lesson } from "./scripts/build-schedule.ts";

export function getAudiences(
  schedule: {
    [x: string]: string[] | Record<string, (Lesson[] | null)[]>;
  },
) {
  const prioritized = (schedule[PRIORITIZED_KEY_NAME] as string[]).reduce(
    (acc, ba) => {
      const [building, audition] = ba.split(" ");

      acc[building] ??= [];
      acc[building].push(audition);

      return acc;
    },
    {} as Record<string, string[]>,
  );

  return Object.keys(schedule).reduce((acc, building) => {
    if (building != PRIORITIZED_KEY_NAME) {
      const audiences = Object.keys(
        schedule[building as keyof typeof schedule],
      );
      const sortedAudiences = [
        ...audiences.filter((a) => prioritized[building]?.includes(a)),
        ...audiences.filter((a) => !prioritized[building]?.includes(a)),
      ];

      acc[building] = sortedAudiences.map((a) => {
        if (prioritized[building]?.includes(a)) {
          return COMPUTER_ICON + a;
        }

        return a;
      });
    }

    return acc;
  }, {} as Record<string, string[]>);
}
