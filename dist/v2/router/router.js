import { studentRoutes } from "../modules/student/student.routes.js";
import { organizerRoutes } from "../modules/organizer/organizer.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";

export const appRoutes = [
  ...studentRoutes,
  ...organizerRoutes,
  ...adminRoutes
];

export function resolveRoute(userRole, route) {

  const allowed = {
    student: [
      "/dashboard",
      "/profile",
      "/achievement",
      "/competitions"
    ],

    organizer: [
      "/organizer/dashboard",
      "/organizer/competition-builder"
    ],

    admin: [
      "/admin/dashboard",
      "/admin/users",
      "/admin/features",
      "/admin/audit"
    ]
  };

  return allowed[userRole]?.some(
    item => route.startsWith(item)
  );
}
