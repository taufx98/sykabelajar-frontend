(function () {
  async function unavailable() { throw new Error('Attempt service backend belum tersedia. Hubungkan RPC/Edge Function sesuai contract RPD v4.1.'); }
  window.SYKA_ATTEMPT_SERVICE = { start: unavailable, saveAnswer: unavailable, submit: unavailable, getResume: unavailable };
})();


