export async function getStudentData(
  supabase,
  userId
) {

  const profile = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();


  const achievements = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId);


  const xp = await supabase
    .from("xp_ledger")
    .select("*")
    .eq("user_id", userId);


  return {
    profile: profile.data,
    achievements: achievements.data || [],
    xp: xp.data || []
  };
}
