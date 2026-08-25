import { Card } from '../components/Card.js';

export function LandingPage() {
  return `
    <section class="sy-hero">
      <h1>Platform Kompetisi dan Edukasi Indonesia</h1>
      <p>
        Belajar, berkompetisi, mendapatkan sertifikat,
        dan berkembang bersama Sykabelajar.
      </p>
      <button>Mulai Sekarang</button>
    </section>

    <section class="sy-grid">
      ${Card("Kompetisi", "Ikuti berbagai lomba edukasi.")}
      ${Card("Learning", "Tingkatkan kemampuanmu.")}
      ${Card("Achievement", "Kumpulkan XP dan penghargaan.")}
    </section>
  `;
}
