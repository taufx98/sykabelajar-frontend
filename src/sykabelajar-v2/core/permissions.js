export function canAccess(userRole, permission) {

  const permissions = {
    student: [
      "view_competition",
      "take_exam"
    ],

    organizer: [
      "create_competition",
      "manage_participant"
    ],

    admin: [
      "manage_system"
    ]
  };

  return permissions[userRole]?.includes(permission);
}
