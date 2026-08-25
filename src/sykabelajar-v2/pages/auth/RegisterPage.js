import { Button } from "../../components/Button.js";

export function RegisterPage() {
  return `
    <section class="sy-auth-card">

      <h1 class="sy-heading-lg">
        Daftar Sykabelajar
      </h1>

      <input placeholder="Nama" />

      <input placeholder="Email" />

      ${Button(
        "Register",
        "primary"
      )}

    </section>
  `;
}
