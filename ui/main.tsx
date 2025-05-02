import { render, Suspense, use, useState } from "hono/jsx/dom";
import { z } from "zod";
import { hc } from "hono/client";
import type { Api } from "../server/api.ts";
import { getAudiences } from "../audiences.ts";
import { type Lesson } from "../schedule.ts";
import { useHistoryState } from "./reactive-history.ts";
import { COMPUTER_ICON } from "../constants.ts";

addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
});

const api = hc<Api>("/api");

type Schedule = {
  audiences: Record<string, string[]>;
  lessons: Record<string, Record<string, Lesson[][]>> | null;
};

function readSchedule() {
  if (__ENV__ == "desktop") {
    let submit: null | ((data: Schedule) => void) = null;
    const input = document.getElementById("upload_schedule")!;

    input.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      const text = await file!.text();
      const schedule = JSON.parse(text);

      submit!({ audiences: getAudiences(schedule), lessons: schedule });
    });

    input.click();

    return new Promise<Schedule>((resolve) => {
      submit = resolve;
    });
  } else {
    return Promise.resolve(
      {
        audiences: z.record(z.array(z.string())).parse(
          JSON.parse(document.getElementById("__AUDIENCES__")!.textContent!),
        ),
        lessons: null,
      },
    );
  }
}

function today() {
  const now = new Date();
  const week = Math.floor((now.getDate() - 1) / 7) % 2 ? "верхняя" : "нижняя";
  const formatted = new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(now);

  return `${formatted} ${week} неделя`;
}

const days = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const week: Record<string, string> = {
  up: "Верхняя",
  down: "Нижняя",
  both: "Обе",
};

const schedule = readSchedule();

function App() {
  return (
    <Suspense fallback={<h1>Ожидаем выбор файла</h1>}>
      <View />
    </Suspense>
  );
}

function View() {
  const { audiences, lessons } = use(schedule);
  const buildings = Object.keys(audiences);
  const [building, setBuilding] = useState(buildings[0]);
  const [audience, setAudience] = useState(
    audiences[building][0].replace(
      COMPUTER_ICON,
      "",
    ),
  );

  const audienceLessons = useHistoryState<Lesson[][] | null>();

  const handleShow = async () => {
    let l;

    if (lessons != null) {
      l = lessons[building][audience];
    } else {
      const res = await api.schedule.$get({ query: { audience, building } });
      l = await res.json();
    }

    history.pushState(l, "", null);
  };

  const handleSave = () => {
    print();
  };

  const handleBack = () => {
    history.replaceState(null, "", null);
  };

  return (
    <>
      <header class="positioner">
        <button type="button" onClick={handleBack} class="header_logo">
          <img
            src="/favicon.svg"
            width="42"
            height="71"
            loading="lazy"
            decoding="async"
            alt=""
          />
          <span>СПбГМТУ</span>
        </button>
      </header>

      <main data-view={schedule == null ? "select" : "schedule"}>
        {audienceLessons == null
          ? (
            <div class="positioner text-center">
              <h1>Расписание занятий</h1>
              <p>Сегодня: {today()}</p>
              <div class="select_container">
                <select
                  value={building}
                  onChange={(e) => {
                    const building = (e.target as HTMLSelectElement).value;

                    setBuilding(building);
                    setAudience(audiences[building][0].replace(
                      COMPUTER_ICON,
                      "",
                    ));
                  }}
                >
                  {buildings.map((b) => <option value={b} key={b}>{b}</option>)}
                </select>
                <select
                  value={audience}
                  onChange={(e) =>
                    setAudience((e.target as HTMLSelectElement).value)}
                >
                  {audiences[building].map((a) => (
                    <option
                      value={a.replace(
                        COMPUTER_ICON,
                        "",
                      )}
                      key={a}
                    >
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div class="action_container">
                {__ENV__ == "web" && (
                  <a href="/schedule.json" download>
                    Сохранить
                  </a>
                )}
                <button type="button" onClick={handleShow}>
                  Показать
                </button>
              </div>
            </div>
          )
          : (
            <>
              <div class="positioner">
                <h1>
                  Расписание занятий аудитории {building}
                  {audience}{" "}
                  <button
                    type="button"
                    onClick={handleSave}
                    data-print="hide"
                  >
                    <img
                      src="/assets/download.svg"
                      alt="Скачать"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </h1>
                <p data-print="hide">Сегодня: {today()}</p>
              </div>

              <div id="schedule">
                <div class="positioner">
                  {audienceLessons.map((day, i) =>
                    day
                      ? (
                        <table>
                          <caption>{days[i]}</caption>
                          <thead>
                            <tr>
                              <td>Время</td>
                              <td>Неделя</td>
                              <td>Группы</td>
                              <td>Предмет</td>
                              <td>Преподаватель</td>
                            </tr>
                          </thead>
                          <tbody>
                            {day.map((l, i) => (
                              <tr key={i}>
                                <td>{l.time}</td>
                                <td>
                                  <img
                                    alt={week[l.week]}
                                    src={`/assets/${l.week}.svg`}
                                    loading="lazy"
                                    decoding="async"
                                    title={week[l.week]}
                                  />
                                </td>
                                <td>{l.group}</td>
                                <td>{l.subject}</td>
                                <td>{l.teacher}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                      : null
                  )}
                </div>
              </div>
            </>
          )}
      </main>
    </>
  );
}

const root = document.getElementById("root")!;
render(<App />, root);
