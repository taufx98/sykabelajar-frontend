export async function getSystemOverview(
  supabase
){

  const users = await supabase
    .from("profiles")
    .select("*");


  const logs = await supabase
    .from("audit_logs")
    .select("*");


  return {
    users: users.data || [],
    logs: logs.data || []
  };
}
