import { Card } from "../../components/Card.js";

export function UserManagementPage(users = []) {
  return `
    <section>

      <h1 class="sy-heading-lg">
        User Management
      </h1>

      <div class="sy-grid">

      ${
        users.length
        ? users.map(
          user => Card(
            user.name,
            user.role
          )
        ).join("")
        :
        Card(
          "No Users",
          "Data user belum tersedia."
        )
      }

      </div>

    </section>
  `;
}
