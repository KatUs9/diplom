import * as cheerio from "cheerio";

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
    const group = Number(href.replace(/[^0-9]/g, ""));

    const res = await fetch(`${WEBSITE_HOST}/${href}`);
    const html = await res.text();

    return [group, cheerio.load(html)] as const;
  }));
}

function parse(schedules: (readonly [number, cheerio.CheerioAPI])[]) {
  return schedules.map(([group, $]) =>
    [
      group,
      ...$("tbody").toArray().map((tbody) =>
        $(tbody).find("tr").toArray().map((row) => {
          const cols = $(row).find("td, th");

          const [start, end] = $(cols[0]).text().trim().split("-");
          const week = $(cols[1]).children().attr()?.["data-bs-title"];
          const [building, classroom] = $(cols[2]).text().trim().split(" ");
          const subject = $(cols[4]).children().first().text().trim();
          const kind = $(cols[4]).children("small").first().text().trim();
          const teacher = $(cols[5]).text().trim();

          return {
            start,
            end,
            week: week == "Верхняя неделя"
              ? "up"
              : week == "Нижняя неделя"
              ? "down"
              : "both",
            building,
            classroom,
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

function transform(ast: ReturnType<typeof parse>) {
  const result: Record<string, Record<string, any[]>> = {};
  const days = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];

  for (const [group, ...dayLessons] of ast) {
    dayLessons.forEach((day, dayIndex) => {
      for (const lesson of day) {
        const { building, classroom } = lesson;

        if (!result[building]) {
          result[building] = {};
        }

        if (!result[building][classroom]) {
          result[building][classroom] = [];
        }

        result[building][classroom].push({
          ...lesson,
          group,
          day: days[dayIndex],
          dayIndex,
        });
      }
    });
  }

  return result;
}

const hrefs = await listSchedule();
const schedules = await fetchSchedules(hrefs);
const schedule = transform(parse(schedules));

Deno.writeTextFileSync("static/schedule.json", JSON.stringify(schedule));
