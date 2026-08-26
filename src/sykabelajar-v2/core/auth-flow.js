import { getProfile } from "../services/profile.service.js";

export async function initializeUserSession(supabase, user) {
  if (!user) {
    return {
      authenticated: false,
      role: null,
      profile: null
    };
  }

  const profile = await getProfile(
    supabase,
    user.id
  );

  return {
    authenticated: true,
    role: profile?.role || "student",
    profile
  };
}
