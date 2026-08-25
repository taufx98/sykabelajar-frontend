export function ProfilePage(profile = {}) {
  return `
    <section class="sy-profile-card">
      <h1 class="sy-heading-lg">
        Profile
      </h1>

      <p class="sy-text">
        ${profile.name || "User"}
      </p>
    </section>
  `;
}
