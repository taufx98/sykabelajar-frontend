import { startRouter } from "./router/index.js";
import { initializeV2Core } from "./core/index.js";

/**
 * Sykabelajar V2 Runtime Bootstrap
 *
 * Entry point for the new frontend architecture.
 * This file intentionally does not replace legacy modules yet.
 * It activates V2 gradually through the existing SYKA_APP loader.
 */

export async function startSykabelajarV2(options = {}) {
  const core = await initializeV2Core(options);
  const router = startRouter(options);

  document.documentElement.dataset.sykabelajar = "v2";

  return {
    version: "2.0",
    status: "initialized",
    core,
    router
  };
}
