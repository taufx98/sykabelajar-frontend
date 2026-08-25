import { Button } from "../components/Button.js";
import { Card } from "../components/Card.js";

export function LandingPage(data = {}) {
  const competitions = data.competitions || [];

  return `
    <section class="sy-hero">
      <div>
        <h1 class="sy-heading-xl">
          Platform Kompetisi dan Edukasi Indonesia
        </h1>

        <p class="sy-text">
          Belajar, berkompetisi, mendapatkan sertifikat,
          dan berkembang bersama Sykabelajar.
        </p>

        ${Button("Mulai Sekarang", "primary")}
      </div>
    </section>


    <section class="sy-section">
      <h2 class="sy-heading-lg">
        Kompetisi Terbaru
      </h2>

      <div class="sy-grid">
        ${
          competitions.length
          ? competitions.map(item =>
            Card(item.title, item.description)
          ).join("")
          : Card(
              "Kompetisi Sykabelajar",
              "Kompetisi menarik akan segera hadir."
            )
        }
      </div>
    </section>


    <section class="sy-section sy-feature-section">
      <h2 class="sy-heading-lg">
        Mengapa Sykabelajar?
      </h2>

      <div class="sy-grid">
        ${Card("Competition", "Ikuti lomba dan uji kemampuan.")}
        ${Card("Achievement", "Kumpulkan XP, badge, dan penghargaan.")}
        ${Card("Certificate", "Dapatkan sertifikat digital terpercaya.")}
      </div>
    </section>


    <section class="sy-organizer-cta">
      <h2 class="sy-heading-lg">
        Selenggarakan Kompetisi Anda
      </h2>

      <p class="sy-text">
        Organizer dapat membuat event,
        mengelola peserta, dan menerbitkan sertifikat.
      </p>

      ${Button("Mulai Sebagai Organizer", "secondary")}
    </section>
  `;
}
