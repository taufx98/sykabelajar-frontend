import { Card } from "../../components/Card.js";

export function AchievementPage(items = []) {
  return `
    <section>
      <h1 class="sy-heading-lg">
        Achievement
      </h1>

      <div class="sy-grid">
        ${
          items.length
          ? items.map(
              item => Card(item.name, item.description)
            ).join("")
          : Card(
              "Belum Ada Achievement",
              "Mulai aktivitas untuk mendapatkan badge."
            )
        }
      </div>
    </section>
  `;
}
