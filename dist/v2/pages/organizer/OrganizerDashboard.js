import { Card } from "../../components/Card.js";
import { Badge } from "../../components/Badge.js";

export function OrganizerDashboard(data = {}) {
  return `
    <section class="sy-dashboard-header">
      <h1 class="sy-heading-lg">
        Organizer Dashboard
      </h1>

      <p class="sy-text">
        Kelola kompetisi, peserta, dan event edukasi Anda.
      </p>

      ${Badge("Organizer")}
    </section>

    <section class="sy-grid">
      ${Card(
        "Total Competition",
        data.competitions || "0"
      )}

      ${Card(
        "Participants",
        data.participants || "0"
      )}

      ${Card(
        "Certificates",
        data.certificates || "0"
      )}
    </section>
  `;
}
