import * as cheerio from "cheerio";
import retry from "fetch-retry";
import { chunk } from "./utils/chunk.ts";

export type Lesson = {
  time: string;
  week: string;
  group: string;
  subject: string;
  kind: string;
  teacher: string;
};

const WEBSITE_HOST = "https://www.smtu.ru";

async function listSchedule(f: typeof fetch) {
  const res = await retry(f)(`${WEBSITE_HOST}/ru/listschedule/`, {
    retries: 3,
    retryDelay: 1000,
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const hrefs = $('a[href^="/ru/viewschedule"]')
    .map((_, a) => a.attribs.href)
    .toArray();

  return hrefs;
}

function fetchSchedules(
  f: typeof fetch,
  hrefs: string[],
  options?: { onResponse?: (res: Response) => void },
) {
  const { onResponse } = options ?? {};

  return chunk(hrefs, 10, async (href) => {
    const group = href.replace(/[^0-9]/g, "");

    const res = await retry(f)(`${WEBSITE_HOST}${href}`, {
      retries: 3,
      retryDelay: 1000,
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();

    onResponse?.(res);

    return [group, cheerio.load(html)] as const;
  });
}

function parse(schedules: (readonly [string, cheerio.CheerioAPI])[]) {
  return schedules.map(([group, $]) =>
    [
      group,
      ...$("tbody").toArray().map((tbody) =>
        $(tbody).find("tr").toArray().map((row) => {
          const cols = $(row).find("td, th");

          const [start, end] = $(cols[0]).text().trim().split("-");
          const week = $(cols[1]).children().attr()?.["data-bs-title"];
          const [building, audience] = $(cols[2]).text().trim().split(" ");
          const subject = $(cols[4]).children().first().text().trim();
          const kind = $(cols[4]).children("small").first().text().trim();
          const teacher = $(cols[5]).text().trim();

          return {
            time: `${start}-${end}`,
            week: week == "Верхняя неделя"
              ? "up"
              : week == "Нижняя неделя"
              ? "down"
              : "both",
            building,
            audience,
            subject,
            kind: kind == "Практическое занятие"
              ? "practice"
              : kind == "Лекция"
              ? "lecture"
              : "lab",
            teacher,
          } as const;
        })
      ),
    ] as const
  );
}

function transform(
  ast: ReturnType<
    typeof parse
  >,
) {
  const schedule = ast.reduce(
    (
      acc,
      [group, ...days],
    ) => {
      for (let i = 0; i < days.length; i++) {
        for (const lesson of days[i]) {
          const { building, audience, subject, kind, teacher, time, week } =
            lesson;

          acc[building] ??= {};
          acc[building][audience] ??= new Array(6);
          acc[building][audience][i] ??= [];
          acc[building][audience][i].push(
            {
              group,
              subject,
              kind,
              teacher,
              time,
              week,
            },
          );
        }
      }

      return acc;
    },
    {} as Record<string, Record<string, Lesson[][]>>,
  );

  for (const building of Object.keys(schedule)) {
    for (const audience of Object.keys(schedule[building])) {
      schedule[building][audience] = schedule[building][audience].map(
        (dayLessons) => {
          const map: Record<string, Lesson> = {};

          for (const les of dayLessons) {
            const key = [les.time, les.subject, les.kind, les.teacher, les.week]
              .join("|");
            if (!map[key]) {
              map[key] = { ...les, group: les.group };
            } else {
              map[key].group = `${map[key].group}, ${les.group}`;
            }
          }

          return Object.values(map).sort((a, b) =>
            a.time.localeCompare(b.time)
          );
        },
      );
    }
  }

  return schedule;
}

export async function buildSchedule(
  f: typeof fetch,
  options?: { onProgress: (pct: number) => void },
) {
  const { onProgress } = options ?? {};

  const hrefs = await listSchedule(f);

  let nFinished = 0;

  const schedules = await fetchSchedules(f, hrefs, {
    onResponse() {
      nFinished += 1;
      onProgress?.(Math.round(100 * nFinished / hrefs.length));
    },
  });
  const schedule = transform(parse(schedules));

  return schedule;
}
