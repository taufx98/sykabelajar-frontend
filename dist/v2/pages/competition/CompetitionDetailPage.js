import { Button } from "../../components/Button.js";

export function CompetitionDetailPage(item = {}) {
  return `
    <section class="sy-competition-detail">

      <h1 class="sy-heading-lg">
        ${item.title || "Competition Detail"}
      </h1>

      <p class="sy-text">
        ${item.description || ""}
      </p>

      ${Button("Daftar Kompetisi", "primary")}

    </section>
  `;
}
