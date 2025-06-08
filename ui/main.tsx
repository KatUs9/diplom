import { render, useState } from "hono/jsx/dom";
import { z } from "zod";
import { hc } from "hono/client";
import type { Api } from "../server/api.ts";
import { getAudiences } from "../audiences.ts";
import { buildSchedule, type Lesson } from "../schedule.ts";
import { useHistoryState } from "./reactive-history.ts";
import { COMPUTER_ICON, PRIORITIZED_KEY_NAME } from "../constants.ts";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { config } from "../config/tauri.ts";
import { save as tauriSelectFilePath } from "@tauri-apps/plugin-dialog";
import { writeTextFile as tauriSaveFile } from "@tauri-apps/plugin-fs";

if (__ENV__ == "web") {
  addEventListener("load", async () => {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
    }
  });
}

const api = hc<Api>("/api");

type Schedule = {
  audiences: Record<string, string[]>;
  lessons: Record<string, Record<string, (Lesson[] | null)[]>> | null;
};

const days = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const timeSlots = [
  "08:30-10:00",
  "10:10-11:40",
  "11:50-13:20",
  "14:00-15:30",
  "15:40-17:10",
  "17:20-18:50",
  "19:00-20:30",
  "20:40-22:10",
];

function parseAudiencesScriptTag() {
  return {
    audiences: z.record(z.array(z.string())).parse(
      JSON.parse(document.getElementById("__AUDIENCES__")!.textContent!),
    ),
    lessons: null,
  };
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

function teacher(name: string) {
  const [second, first, middle] = name.split(" ");

  return `${second} ${first[0]}.${middle[0]}.`;
}

function App() {
  const [schedule, setSchedule] = useState<Schedule | null>(
    __ENV__ == "web" ? parseAudiencesScriptTag() : null,
  );

  return schedule
    ? <ScheduleView schedule={schedule} />
    : <UploadView onChange={(s) => setSchedule(s)} />;
}

function UploadView({ onChange }: { onChange?: (schedule: Schedule) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [pctProgress, setPctProgress] = useState<number | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setPctProgress(0);

      const [schedule, cfg] = await Promise.all([
        buildSchedule(tauriFetch, {
          onProgress: setPctProgress,
        }),
        config(),
      ]);
      const prioritizedSchedule = {
        ...schedule,
        [PRIORITIZED_KEY_NAME]: cfg.schedule.computer_audiences,
      };
      onChange?.({
        audiences: getAudiences(prioritizedSchedule),
        lessons: schedule,
      });

      const filepath = await tauriSelectFilePath({
        filters: [{ name: "JSON Files", extensions: ["json"] }],
        defaultPath: "schedule.json",
      });

      if (filepath) {
        await tauriSaveFile(filepath, JSON.stringify(prioritizedSchedule));
      }
    } catch (e) {
      setPctProgress(null);
      console.error(e);
      alert("Сайт ВУЗа недоступен или отсутсвует интернет соединение.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="upload" class="positioner">
      <input
        type="file"
        accept="application/json"
        id="upload_schedule"
        onChange={async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          const text = await file!.text();
          const schedule = JSON.parse(text);

          onChange?.({ audiences: getAudiences(schedule), lessons: schedule });
        }}
        hidden
      />
      <label for="upload_schedule" data-button>Загрузить расписание</label>
      <span>или</span>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        data-button
      >
        {isLoading ? `Формируем ${pctProgress}%` : "Сформировать"}
      </button>
    </div>
  );
}

function ScheduleView(
  { schedule: { audiences, lessons } }: { schedule: Schedule },
) {
  const buildings = Object.keys(audiences);
  const [building, setBuilding] = useState(buildings[0]);
  const [audience, setAudience] = useState(
    audiences[building][0].replace(
      COMPUTER_ICON,
      "",
    ),
  );

  const audienceLessons = useHistoryState<(Lesson[] | null)[] | null>();

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
    setBuilding(buildings[0]);
    setAudience(audiences[building][0].replace(
      COMPUTER_ICON,
      "",
    ));

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

      <main data-view={audienceLessons == null ? "select" : "schedule"}>
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
                {__ENV__ == "web"
                  ? (
                    <a href="/schedule.json" download data-button>
                      Сохранить
                    </a>
                  )
                  : null}
                <button type="button" onClick={handleShow} data-button>
                  Показать
                </button>
              </div>
            </div>
          )
          : (
            <>
              <div class="positioner">
                <h1>
                  Расписание занятий аудитории {building} {audience}{" "}
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
                <div class="positioner scrollable">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">{building} {audience}</th>
                        {days.map((day) => (
                          <th key={day} scope="col">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot) => (
                        <tr key={slot}>
                          <th scope="row">{slot.split("-")[0]}</th>
                          {audienceLessons.map((day, i) => {
                            const l = day?.find(({ time }) => time == slot);

                            return (
                              <td key={i}>
                                {l?.week == "down"
                                  ? (
                                    <>
                                      ————————
                                      <br />
                                    </>
                                  )
                                  : null}
                                {l
                                  ? (
                                    <>
                                      {l.group}
                                      <br />
                                      {l.teacher && teacher(l.teacher)}
                                    </>
                                  )
                                  : null}
                                {l?.week == "up"
                                  ? (
                                    <>
                                      <br />
                                      ————————
                                    </>
                                  )
                                  : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
