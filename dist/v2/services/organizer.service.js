export async function getOrganizerDashboard(
  supabase,
  organizerId
) {
  return {
    competitions: 0,
    participants: 0,
    certificates: 0
  };
}


export async function createCompetition(
  supabase,
  payload
) {
  return {};
}


export async function getParticipants(
  supabase,
  competitionId
) {
  return [];
}
