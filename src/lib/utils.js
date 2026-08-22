(function () {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }
  function initials(name) { return (String(name || 'U').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('') || 'U').toUpperCase(); }
  function debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }
  function routePath() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('route')) return url.searchParams.get('route');
    if (window.location.hash && window.location.hash.startsWith('#/')) return window.location.hash.slice(1);
    return url.pathname || '/';
  }
  function queryParams() {
    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams.entries());
    if (params.route) delete params.route;
    return params;
  }
  function randomId(prefix = 'req') { return prefix + '_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function cloudinaryTransform(url, opts = {}) {
    if (!url || !url.includes('/upload/')) return url || '';
    const parts = url.split('/upload/');
    const trans = [];
    if (opts.width) trans.push(`w_${Math.round(opts.width)}`);
    if (opts.height) trans.push(`h_${Math.round(opts.height)}`);
    if (opts.crop) trans.push(`c_${opts.crop}`);
    if (opts.gravity) trans.push(`g_${opts.gravity}`);
    trans.push('q_auto', 'f_auto');
    return parts[0] + '/upload/' + trans.join(',') + '/' + parts[1];
  }
  function getStoredTheme() { return localStorage.getItem('syka_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch (_) { return fallback; } }
  window.SYKA_UTILS = { escapeHtml, formatDate, initials, debounce, routePath, queryParams, randomId, cloudinaryTransform, getStoredTheme, safeJson };
})();


