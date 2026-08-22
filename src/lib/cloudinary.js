(function () {
  const cache = new Map();

  function widgetConfig(options = {}) {
    const cfg = window.SYKA_CONFIG || {};
    const folder = options.folder || cfg.CLOUDINARY_FOLDER || 'sykabelajar/uploads';
    const crop = options.crop || false;
    return {
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      uploadPreset: cfg.CLOUDINARY_UPLOAD_PRESET,
      folder,
      sources: options.sources || ['local', 'camera'],
      multiple: false,
      resourceType: options.resourceType || 'image',
      cropping: crop,
      croppingAspectRatio: options.croppingAspectRatio,
      maxFileSize: options.maxFileSize || 8000000,
      clientAllowedFormats: options.formats || ['png', 'jpg', 'jpeg', 'webp'],
      showAdvancedOptions: false,
      singleUploadAutoClose: false,
      styles: {
        palette: {
          window: '#ffffff',
          windowBorder: '#e2e8f0',
          tabIcon: '#7c3aed',
          menuIcons: '#475569',
          textDark: '#0f172a',
          textLight: '#ffffff',
          link: '#7c3aed',
          action: '#7c3aed',
          inactiveTabIcon: '#94a3b8',
          error: '#dc2626',
          inProgress: '#7c3aed',
          complete: '#059669'
        }
      }
    };
  }

  function openImageWidget(options = {}) {
    const key = JSON.stringify(widgetConfig(options));
    let widget = cache.get(key);

    return new Promise((resolve, reject) => {
      if (!window.cloudinary || typeof window.cloudinary.createUploadWidget !== 'function') {
        reject(new Error('Cloudinary Upload Widget belum dimuat.'));
        return;
      }

      const open = () => widget.open();

      if (!widget) {
        widget = window.cloudinary.createUploadWidget(widgetConfig(options), (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (result?.event === 'success') {
            resolve(result.info);
          }
        });
        cache.set(key, widget);
      }

      open();
    });
  }

  function openAvatarWidget(onSuccess, onError) {
    openImageWidget({
      folder: (window.SYKA_CONFIG?.CLOUDINARY_FOLDER || 'sykabelajar/users/profiles'),
      crop: true,
      croppingAspectRatio: 1,
      maxFileSize: 5000000
    }).then(onSuccess).catch(onError);
  }

  function openCompetitionImageWidget(onSuccess, onError) {
    openImageWidget({
      folder: 'sykabelajar/competitions/posters',
      maxFileSize: 10000000,
      crop: true,
      croppingAspectRatio: 16 / 9
    }).then(onSuccess).catch(onError);
  }

  function openPromoImageWidget(onSuccess, onError) {
    openImageWidget({
      folder: 'sykabelajar/home/promos',
      maxFileSize: 10000000,
      crop: true,
      croppingAspectRatio: 16 / 9
    }).then(onSuccess).catch(onError);
  }

  function openProductImageWidget(onSuccess, onError) {
    openImageWidget({
      folder: 'sykabelajar/store/products',
      maxFileSize: 8000000,
      crop: true,
      croppingAspectRatio: 1
    }).then(onSuccess).catch(onError);
  }

  function openPaymentProofWidget(onSuccess, onError) {
    openImageWidget({
      folder: 'sykabelajar/orders/payment-proofs',
      maxFileSize: 8000000,
      crop: false
    }).then(onSuccess).catch(onError);
  }

  function openTwibbonWidget(onSuccess, onError) {
    openImageWidget({
      folder: 'sykabelajar/competitions/twibbon',
      maxFileSize: 10000000,
      crop: true,
      croppingAspectRatio: 1
    }).then(onSuccess).catch(onError);
  }

  window.SYKA_CLOUDINARY = {
    openImageWidget,
    openAvatarWidget,
    openCompetitionImageWidget,
    openPromoImageWidget,
    openProductImageWidget,
    openPaymentProofWidget,
    openTwibbonWidget
  };
})();
