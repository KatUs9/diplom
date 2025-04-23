import * as cheerio from "cheerio";
import { cfg } from "../config.ts";

export type Lesson = {
  time: `${string}-${string}`;
  week: "both" | "up" | "down";
  group: string;
  subject: string;
  kind: "practice" | "lecture" | "lab";
  teacher: string;
};

const WEBSITE_HOST = "https://www.smtu.ru";

async function listSchedule() {
  const res = await fetch(`${WEBSITE_HOST}/ru/listschedule/`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const hrefs = $('a[href^="/ru/viewschedule"]')
    .map((_, a) => a.attribs.href)
    .toArray();

  return hrefs;
}

function fetchSchedules(hrefs: string[]) {
  return Promise.all(hrefs.map(async (href) => {
    const group = href.replace(/[^0-9]/g, "");

    const res = await fetch(`${WEBSITE_HOST}/${href}`);
    const html = await res.text();

    return [group, cheerio.load(html)] as const;
  }));
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
          acc[building][audience] ??= [];
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

  return {
    ...schedule,
    [cfg.schedule.prioritized_key_name]: cfg.schedule.computer_audiences,
  };
}

const hrefs = await listSchedule();
const schedules = await fetchSchedules(hrefs);
const schedule = transform(parse(schedules));

Deno.writeTextFileSync("static/schedule.json", JSON.stringify(schedule));
