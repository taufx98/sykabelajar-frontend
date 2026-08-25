export function Button(label, type = "primary") {
  return `
    <button class="sy-btn sy-btn-${type}">
      ${label}
    </button>
  `;
}
