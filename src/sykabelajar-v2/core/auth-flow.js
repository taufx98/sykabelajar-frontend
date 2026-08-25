import { getProfile } from "../services/profile.service.js";

export async function initializeUserSession(supabase, user) {
  if (!user) {
    return {
      authenticated: false,
      role: null,
      profile: null
    };
  }

  const legacyAuth = window.SYKA_STATE?.getState?.()?.auth;
  const profile = legacyAuth?.profile || await getProfile(supabase, user.id);
  const roles = legacyAuth?.roles || [];

  return {
    authenticated: true,
    role: roles.includes("admin") ? "admin" : roles.includes("organizer") ? "organizer" : profile?.role || "student",
    profile
  };
}
