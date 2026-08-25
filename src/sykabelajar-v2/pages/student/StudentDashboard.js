import { Card } from "../../components/Card.js";
import { Badge } from "../../components/Badge.js";

export function StudentDashboard(data = {}) {
  const profile = data.profile || {};
  const achievements = data.achievements || [];

  return `
    <section class="sy-dashboard-header">
      <h1 class="sy-heading-lg">
        Halo, ${profile.name || "Student"}
      </h1>

      <p class="sy-text">
        Lanjutkan perjalanan belajar dan kompetisimu.
      </p>

      ${Badge("Student")}
    </section>


    <section class="sy-grid">
      ${Card(
        "XP",
        profile.xp || "0 XP"
      )}

      ${Card(
        "Edu Coin",
        profile.coins || "0 Coin"
      )}

      ${Card(
        "Achievement",
        `${achievements.length} Badge`
      )}
    </section>


    <section class="sy-section">
      <h2 class="sy-heading-lg">
        Aktivitas Saya
      </h2>

      <div class="sy-grid">
        ${Card(
          "Kompetisi",
          "Lihat kompetisi yang sedang diikuti."
        )}

        ${Card(
          "Certificate",
          "Akses sertifikat digital."
        )}

        ${Card(
          "Daily Task",
          "Selesaikan aktivitas harian."
        )}
      </div>
    </section>
  `;
}
