export function mountSykabelajarV2(rootId) {
  const root = document.getElementById(rootId);

  if (!root) {
    throw new Error("Sykabelajar mount point not found");
  }

  root.innerHTML = `
    <div class="sykabelajar-v2">
      Sykabelajar V2 Loaded
    </div>
  `;
}
