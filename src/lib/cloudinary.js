(function () {
  let widget = null;
  function createAvatarWidget(onSuccess, onError) {
    const cfg = window.SYKA_CONFIG;
    if (!window.cloudinary || typeof window.cloudinary.createUploadWidget !== 'function') {
      onError?.(new Error('Cloudinary Upload Widget belum dimuat.'));
      return null;
    }
    if (widget) return widget;
    widget = window.cloudinary.createUploadWidget({
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      uploadPreset: cfg.CLOUDINARY_UPLOAD_PRESET,
      folder: cfg.CLOUDINARY_FOLDER,
      sources: ['local', 'camera'],
      multiple: false,
      resourceType: 'image',
      cropping: true,
      croppingAspectRatio: 1,
      maxFileSize: 5000000,
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
      showAdvancedOptions: false,
      singleUploadAutoClose: false
    }, (error, result) => {
      if (error) { onError?.(error); return; }
      if (result?.event === 'success') onSuccess?.(result.info);
    });
    return widget;
  }
  function openAvatarWidget(onSuccess, onError) { createAvatarWidget(onSuccess, onError)?.open(); }
  window.SYKA_CLOUDINARY = { createAvatarWidget, openAvatarWidget };
})();


