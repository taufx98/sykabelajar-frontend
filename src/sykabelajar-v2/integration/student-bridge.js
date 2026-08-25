import { getStudentDashboard } from "../services/student.service.js";

/** Read-only V2 student API backed by the existing legacy services. */
export async function getV2StudentDashboard() {
  const user = window.SYKA_STATE?.getState?.()?.auth?.user;
  if (!user?.id) return { authenticated: false, profile: {}, achievements: [], competitions: [], xp: [] };
  const supabase = window.SYKA_SUPABASE?.get?.();
  const dashboard = await getStudentDashboard(supabase, user.id);
  return { authenticated: true, ...dashboard };
}
