import { render } from "hono/jsx/dom";

function App() {
  return (
    <div>
      <h1>Расписание занятий</h1>
      <p>Сегодня: 26 февраля 2025 года, Среда, верхняя неделя</p>
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
      <div>
        <a href="/export/schedule">Сохранить</a>
        <button type="button">
          Показать
        </button>
      </div>
    </div>
  );
}

const root = document.getElementById("root")!;
render(<App />, root);
