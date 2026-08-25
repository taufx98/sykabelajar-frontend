export async function getCertificates(
  supabase,
  userId
) {

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId);

  if(error) throw error;

  return data || [];
}
