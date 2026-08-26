(function () {
  window.SYKA_APP = {
    async init() {
      document.documentElement.dataset.sykabelajar = 'v2';
      return window.SYKA_V2_BOOTSTRAP();
    }
  };
}());
