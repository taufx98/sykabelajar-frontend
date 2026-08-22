(function () {
  let activeRoot = null;
  let previousOverflow = '';

  function open({ title = '', html = '', onOpen, onClose, wide = false, closeOnBackdrop = false, closeOnEscape = false } = {}) {
    close();

    const root = document.createElement('div');
    root.id = 'syka-modal-root';
    root.className = 'syka-modal-backdrop';
    root.dataset.closeOnBackdrop = closeOnBackdrop ? 'true' : 'false';

    root.innerHTML = `
      <div class="syka-modal ${wide ? 'syka-modal-wide' : ''}"
           role="dialog"
           aria-modal="true"
           aria-label="${window.SYKA_UTILS.escapeHtml(title)}">
        <div class="syka-modal-head">
          <div>
            <h2>${window.SYKA_UTILS.escapeHtml(title)}</h2>
          </div>
          <button
            class="syka-icon-btn"
            type="button"
            data-close
            aria-label="Tutup">
            ×
          </button>
        </div>
        <div class="syka-modal-body">${html}</div>
      </div>
    `;

    document.body.appendChild(root);
    activeRoot = root;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // IMPORTANT: modal backdrop clicks never close by default.
    // Forms/editors can safely be clicked outside their dialog without
    // accidentally losing the user's work. Only an explicit [data-close]
    // control closes the modal, unless a caller opts into closeOnBackdrop.
    root.addEventListener('click', (event) => {
      const closeControl = event.target.closest?.('[data-close]');
      if (closeControl) {
        event.preventDefault();
        close();
        return;
      }

      if (
        closeOnBackdrop &&
        event.target === root
      ) {
        close();
      }
    });

    const handleKeydown = (event) => {
      // Default is deliberately locked: Escape does not dismiss a form.
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    if (closeOnEscape) {
      root._sykaModalKeydown = handleKeydown;
      document.addEventListener('keydown', handleKeydown);
    }

    onOpen?.(root.querySelector('.syka-modal-body'), root);

    window._sykaModalClose = () => {
      onClose?.();

      if (root._sykaModalKeydown) {
        document.removeEventListener('keydown', root._sykaModalKeydown);
      }

      if (root.isConnected) {
        root.remove();
      }

      if (activeRoot === root) {
        activeRoot = null;
        document.body.style.overflow = previousOverflow || '';
      }

      window._sykaModalClose = null;
    };
  }

  function close() {
    if (window._sykaModalClose) {
      window._sykaModalClose();
      return;
    }

    const root = document.getElementById('syka-modal-root');
    if (root) root.remove();
    activeRoot = null;
    document.body.style.overflow = previousOverflow || '';
  }

  window.SYKA_MODAL = {
    open,
    close,
    isOpen: () => Boolean(activeRoot && activeRoot.isConnected)
  };
})();
