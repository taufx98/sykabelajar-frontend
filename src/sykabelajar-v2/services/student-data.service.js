export async function getStudentData(
  supabase,
  userId
) {
  const legacy = window.SYKA_STATE?.getState?.()?.auth || {};
  if (legacy.user?.id === userId) {
    const [achievements, competitions] = await Promise.all([
      window.SYKA_AWARD_SERVICE?.getAwards?.(userId) || [],
      window.SYKA_COMPETITION_SERVICE?.list?.({ limit: 20 }) || []
    ]);
    return {
      profile: legacy.profile || null,
      achievements,
      xp: legacy.profile?.xp ? [{ amount: legacy.profile.xp }] : [],
      competitions
    };
  }

  if (!supabase?.from || !userId) {
    return { profile: null, achievements: [], xp: [], competitions: [] };
  }

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


  const competitions = await supabase
    .from("competitions")
    .select("*")
    .limit(20);

  return {
    profile: profile.data,
    achievements: achievements.data || [],
    xp: xp.data || [],
    competitions: competitions.data || []
  };
}
