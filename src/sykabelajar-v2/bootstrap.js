import { startRouter } from "./router/index.js";
import { initializeV2Core } from "./core/index.js";
import { getV2AuthState } from "./integration/auth-bridge.js";
import { getV2StudentDashboard } from "./integration/student-bridge.js";

/**
 * Sykabelajar V2 Runtime Bootstrap
 *
 * Entry point for the new frontend architecture.
 * This file intentionally does not replace legacy modules yet.
 * It activates V2 gradually through the existing SYKA_APP loader.
 */

export async function startSykabelajarV2(options = {}) {
  const core = await initializeV2Core(options);
  const auth = await getV2AuthState();
  const student = auth.authenticated ? await getV2StudentDashboard() : null;
  const router = startRouter(options);

  window.SYKA_V2_STUDENT = { getDashboard: getV2StudentDashboard };

  document.documentElement.dataset.sykabelajar = "v2";

  return {
    version: "2.0",
    status: "initialized",
    core,
    auth,
    student,
    router
  };
}
