(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getSession() { const { data, error } = await client().auth.getSession(); if (error) throw error; return data.session; }
  async function signIn({ email, password }) { const { data, error } = await client().auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
  async function signUp({ email, password, fullName, username, accountType='student', grade, birthDate, institution, schoolId, guardianName, whatsapp, subjects, organizerName, organizerSlug }) {
    const url = new URL(window.location.href); url.searchParams.delete('route'); url.hash = '';
    const metadata = {
      full_name: fullName || '',
      username: username || '',
      grade: grade || '',
      birth_date: birthDate || null,
      institution: institution || '',
      school_id: schoolId || null,
      guardian_name: guardianName || '',
      account_type: accountType || 'student',
      whatsapp: whatsapp || '',
      subjects: subjects || '',
      organizer_name: organizerName || '',
      organizer_slug: organizerSlug || ''
    };
    const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: url.toString(), data: metadata } });
    if (error) throw error;
    return data;
  }
  async function signOut() { const { error } = await client().auth.signOut(); if (error) throw error; }
  async function resetPassword(email) { const url = new URL(window.location.href); url.searchParams.set('route', '/profile'); url.searchParams.set('recovery', '1'); url.hash = ''; const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: url.toString() }); if (error) throw error; }
  async function updatePassword(password) { const { data, error } = await client().auth.updateUser({ password }); if (error) throw error; return data; }
  window.SYKA_AUTH_SERVICE = { getSession, signIn, signUp, signOut, resetPassword, updatePassword };
})();
