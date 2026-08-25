import { Card } from "../../components/Card.js";

export function FeatureFlagPage(flags = []) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        Feature Flags
      </h1>

      <div class="sy-grid">

      ${
        flags.length
        ? flags.map(
          flag => Card(
            flag.name,
            flag.status
          )
        ).join("")
        :
        Card(
          "No Feature",
          "Belum ada konfigurasi."
        )
      }

      </div>

    </section>
  `;
}
