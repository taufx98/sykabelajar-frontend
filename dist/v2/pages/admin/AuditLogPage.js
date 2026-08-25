import { Card } from "../../components/Card.js";

export function AuditLogPage(logs = []) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        Audit Logs
      </h1>

      <div class="sy-grid">

      ${
        logs.length
        ? logs.map(
          log => Card(
            log.action,
            log.created_at
          )
        ).join("")
        :
        Card(
          "No Logs",
          "Belum ada aktivitas."
        )
      }

      </div>

    </section>
  `;
}
