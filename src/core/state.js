(function () {
  const listeners = new Set();
  const state = {
    auth: { session: null, user: null, profile: null, roles: [], permissions: [], status: 'booting' },
    route: { name: 'home', params: {}, query: {} },
    ui: { theme: 'dark', sidebar: true, modal: null, toastQueue: [] },
    network: { online: navigator.onLine, lastError: null, requestId: null },
    competition: { current: null, status: 'idle' },
    registration: { current: null, status: 'idle' },
    attempt: { current: null, status: 'idle', saving: 'idle' },
    notifications: { unreadCount: 0 },
    economy: { xp: 0, eduCoins: 0, season: null }
  };

  function getState() { return state; }
  function patch(path, value) {
    const parts = path.split('.');
    let target = state;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    target[parts[parts.length - 1]] = value;
    listeners.forEach(fn => { try { fn(state, path); } catch (_) {} });
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function resetUserState() {
    state.auth = { session: null, user: null, profile: null, roles: [], permissions: [], status: 'anonymous' };
    state.registration = { current: null, status: 'idle' };
    state.attempt = { current: null, status: 'idle', saving: 'idle' };
    state.notifications = { unreadCount: 0 };
    state.economy = { xp: 0, eduCoins: 0, season: null };
    listeners.forEach(fn => { try { fn(state, 'auth.reset'); } catch (_) {} });
  }
  window.SYKA_STATE = { getState, patch, subscribe, resetUserState };
})();


