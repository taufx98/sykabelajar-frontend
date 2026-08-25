/**
 * Phase 13 runtime core. It deliberately has no authentication side effects:
 * the established legacy runtime remains the owner of the current session.
 */
export async function initializeV2Core(options = {}) {
  const config = window.SYKA_CONFIG || {};
  const runtime = {
    version: "2.0",
    mode: options.mode || "incremental",
    assetBase: config.ASSET_BASE_URL || "",
    startedAt: new Date().toISOString()
  };

  window.SYKA_V2_RUNTIME = runtime;
  document.dispatchEvent(new CustomEvent("syka:v2-ready", { detail: runtime }));
  return runtime;
}
