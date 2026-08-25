import { Card } from "../../components/Card.js";

export function ParticipantPage(items = []) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        Participants
      </h1>

      <div class="sy-grid">

      ${
        items.length
        ? items.map(
          user => Card(
            user.name,
            user.status
          )
        ).join("")
        :
        Card(
          "No Participant",
          "Belum ada peserta."
        )
      }

      </div>

    </section>
  `;
}
