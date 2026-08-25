export function requireAuth(session) {

  if (!session?.authenticated) {
    return {
      redirect: "/login"
    };
  }

  return true;
}
