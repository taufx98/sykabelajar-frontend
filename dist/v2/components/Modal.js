export function Modal(title, content) {
  return `
    <div class="sy-modal">
      <div class="sy-modal-content">
        <h3>${title}</h3>
        <div>${content}</div>
      </div>
    </div>
  `;
}
