(function () {
  const bus = new EventTarget();
  window.SYKA_EVENTS = {
    on(name, fn) { const h = e => fn(e.detail); bus.addEventListener(name, h); return () => bus.removeEventListener(name, h); },
    emit(name, detail) { bus.dispatchEvent(new CustomEvent(name, { detail })); }
  };
})();


