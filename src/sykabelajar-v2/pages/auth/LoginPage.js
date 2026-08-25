import { Button } from "../../components/Button.js";

export function LoginPage() {
  return `
    <section class="sy-auth-card">

      <h1 class="sy-heading-lg">
        Login Sykabelajar
      </h1>

      <input placeholder="Email" />

      <input
        placeholder="Password"
        type="password"
      />

      ${Button(
        "Login",
        "primary"
      )}

    </section>
  `;
}
