import { getStudentData } from "./student-data.service.js";

export async function getStudentDashboard(supabase, userId) {
  const data = await getStudentData(supabase, userId);
  return {
    profile: data.profile || {},
    achievements: data.achievements || [],
    competitions: data.competitions || [],
    xp: data.xp || []
  };
}
