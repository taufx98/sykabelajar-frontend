export async function getCompetitions(supabase) {
  const { data, error } = await supabase
    .from("competitions")
    .select("*");

  if (error) throw error;

  return data || [];
}


export async function getCompetitionById(
  supabase,
  id
) {
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}
