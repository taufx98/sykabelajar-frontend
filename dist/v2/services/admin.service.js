export async function getAdminDashboard(
  supabase
) {
  return {
    users: 0,
    organizers: 0,
    events: 0
  };
}


export async function getAuditLogs(
  supabase
) {
  return [];
}


export async function updateFeatureFlag(
  supabase,
  payload
) {
  return {};
}
