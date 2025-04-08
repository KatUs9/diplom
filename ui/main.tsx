import { render } from "hono/jsx/dom";

addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
});

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
          <select>
            <option value="1">1 корпус</option>
            <option value="2">2 корпус</option>
            <option value="3">3 корпус</option>
          </select>
          <select>
            <option value="231">231</option>
            <option value="123">123</option>
            <option value="543">543</option>
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
