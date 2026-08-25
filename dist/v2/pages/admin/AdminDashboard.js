import { Card } from "../../components/Card.js";
import { Badge } from "../../components/Badge.js";

export function AdminDashboard(data = {}) {
  return `
    <section class="sy-dashboard-header">
      <h1 class="sy-heading-lg">
        Admin Control Center
      </h1>

      <p class="sy-text">
        Kelola sistem, pengguna, dan konfigurasi platform.
      </p>

      ${Badge("Administrator")}
    </section>

    <section class="sy-grid">
      ${Card(
        "Total Users",
        data.users || "0"
      )}

      ${Card(
        "Active Organizers",
        data.organizers || "0"
      )}

      ${Card(
        "System Events",
        data.events || "0"
      )}
    </section>
  `;
}
