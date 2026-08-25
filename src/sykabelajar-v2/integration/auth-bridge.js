import { getSession } from "../core/session.js";
import { initializeUserSession } from "../core/auth-flow.js";

/**
 * Read-only bridge exposed to V2 pages. Authentication writes remain delegated
 * to `core/auth.js`, which uses the legacy service and its existing safeguards.
 */
export async function getV2AuthState() {
  const supabase = window.SYKA_SUPABASE?.get?.();
  const { user, session } = await getSession(supabase);
  const state = await initializeUserSession(supabase, user);
  return { ...state, user, session };
}
