import { Card } from "../../components/Card.js";

export function ResultPage(result = {}) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        Competition Result
      </h1>

      ${Card(
        "Score",
        result.score || "Waiting result"
      )}

    </section>
  `;
}
