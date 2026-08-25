import { Card } from "../../components/Card.js";

export function CompetitionListPage(items = []) {
  return `
    <section>
      <h1 class="sy-heading-lg">
        Competition Center
      </h1>

      <div class="sy-grid">
        ${
          items.length
          ? items.map(item =>
              Card(item.title, item.description)
            ).join("")
          : Card(
              "Belum Ada Kompetisi",
              "Kompetisi akan tersedia segera."
            )
        }
      </div>
    </section>
  `;
}
