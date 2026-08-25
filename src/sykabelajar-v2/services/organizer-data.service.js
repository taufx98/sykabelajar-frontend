export async function getOrganizerCompetitions(
  supabase,
  organizerId
){

  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("organizer_id", organizerId);


  if(error) throw error;

  return data || [];
}
