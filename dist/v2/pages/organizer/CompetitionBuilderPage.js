import { Button } from "../../components/Button.js";

export function CompetitionBuilderPage() {
  return `
    <section class="sy-builder">

      <h1 class="sy-heading-lg">
        Competition Builder
      </h1>

      <p class="sy-text">
        Buat dan konfigurasi kompetisi baru.
      </p>

      <div class="sy-form-card">
        <input placeholder="Nama Kompetisi" />
        <textarea placeholder="Deskripsi"></textarea>
        <input placeholder="Kategori" />

        ${Button(
          "Simpan Kompetisi",
          "primary"
        )}
      </div>

    </section>
  `;
}
