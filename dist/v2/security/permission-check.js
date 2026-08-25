export function validatePermission(
  session,
  action
) {

  if (!session) {
    return false;
  }

  const permissions = {
    student: [
      "view_competition",
      "submit_answer"
    ],

    organizer: [
      "create_competition",
      "manage_question"
    ],

    admin: [
      "manage_platform"
    ]
  };

  return permissions[
    session.role
  ]?.includes(action);
}
