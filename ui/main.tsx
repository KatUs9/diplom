import { render, useState } from "hono/jsx/dom";
import { z } from "zod";
import { hc, InferResponseType } from "hono/client";
import { type Api } from "../server/api.ts";

addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
});

const api = hc<Api>("/api");

function readAudiences() {
  return z.record(z.array(z.string())).parse(
    JSON.parse(document.getElementById("__AUDIENCES__")!.textContent!),
  );
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

const week = {
  up: "Верхняя",
  down: "Нижняя",
  both: "Обе",
};

function App() {
  const audiences = readAudiences();
  const buildings = Object.keys(audiences);
  const [building, setBuilding] = useState(buildings[0]);
  const [audience, setAudience] = useState(
    audiences[building][0],
  );

  const [schedule, setSchedule] = useState<
    | null
    | InferResponseType<typeof api.schedule.$get>
  >(null);

  const handleShow = async () => {
    const res = await api.schedule.$get({ query: { audience, building } });
    setSchedule(await res.json());
  };

  const handleSave = () => {
    console.log("jopa");
  };

  return (
    <>
      <header class="positioner">
        <a
          href="/"
          class="header_logo"
        >
          <img
            src="/favicon.svg"
            width="42"
            height="71"
            loading="lazy"
            decoding="async"
            alt=""
          />
          <span>СПбГМТУ</span>
        </a>
      </header>

      <main data-view={schedule == null ? "select" : "schedule"}>
        {schedule == null
          ? (
            <>
              <h1>Расписание занятий</h1>
              <p>Сегодня: {today()}</p>
              <div class="select_container">
                <select
                  value={building}
                  onChange={(e) =>
                    setBuilding((e.target as HTMLSelectElement).value)}
                >
                  {buildings.map((b) => <option value={b} key={b}>{b}</option>)}
                </select>
                <select
                  value={audience}
                  onChange={(e) =>
                    setAudience((e.target as HTMLSelectElement).value)}
                >
                  {audiences[building].map((a) => (
                    <option value={a} key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div class="action_container">
                <a href="/schedule.json" download>Сохранить</a>
                <button type="button" onClick={handleShow}>
                  Показать
                </button>
              </div>
            </>
          )
          : (
            <>
              <div class="positioner">
                <h1>
                  Расписание занятий аудитории {building}
                  {audience}{" "}
                  <button type="button" onClick={handleSave} data-print="hide">
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
                  {schedule.map((day, i) =>
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
