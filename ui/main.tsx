import { render, useState } from "hono/jsx/dom";
import { z } from "zod";

addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
});

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

function App() {
  const audiences = readAudiences();
  const buildings = Object.keys(audiences);
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]);

  return (
    <>
      <header>
        <a
          href={__ENV__ == "web" ? "https://www.smtu.ru/" : undefined}
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
      <main>
        <h1>Расписание занятий</h1>
        <p>Сегодня: {today()}</p>
        <div>
          <select
            value={selectedBuilding}
            onChange={(e) =>
              setSelectedBuilding((e.target as HTMLSelectElement).value)}
          >
            {buildings.map((b) => <option value={b} key={b}>{b}</option>)}
          </select>
          <select>
            {audiences[selectedBuilding].map((a) => (
              <option value={a} key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div class="action_container">
          <a href="/schedule.json" download>Сохранить</a>
          <button type="button">Показать</button>
        </div>
      </main>
    </>
  );
}

const root = document.getElementById("root")!;
render(<App />, root);
