export function requireRole(
  session,
  role
) {

  if (session.role !== role) {
    return {
      redirect: "/"
    };
  }

  return true;
}
