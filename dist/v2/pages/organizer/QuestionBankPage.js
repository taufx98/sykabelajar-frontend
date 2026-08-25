import { Card } from "../../components/Card.js";

export function QuestionBankPage(items = []) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        Question Bank
      </h1>

      <div class="sy-grid">

        ${
          items.length
          ? items.map(
              q => Card(
                q.title,
                q.description
              )
            ).join("")
          :
          Card(
            "No Questions",
            "Tambahkan soal kompetisi."
          )
        }

      </div>

    </section>
  `;
}
