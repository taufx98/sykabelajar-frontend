(function () {
  const queues = new Map();

  function widgetConfig(options = {}) {
    const cfg = window.SYKA_CONFIG || {};
    return {
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      uploadPreset: cfg.CLOUDINARY_UPLOAD_PRESET,
      folder: options.folder || cfg.CLOUDINARY_FOLDER || 'sykabelajar/uploads',
      sources: options.sources || ['local', 'camera'],
      multiple: false,
      resourceType: options.resourceType || 'image',
      cropping: options.crop || false,
      croppingAspectRatio: options.croppingAspectRatio,
      maxFileSize: options.maxFileSize || 8000000,
      clientAllowedFormats: options.formats || ['png', 'jpg', 'jpeg', 'webp'],
      showAdvancedOptions: false,
      singleUploadAutoClose: true,
      styles: { palette: { window:'#fff', windowBorder:'#e2e8f0', tabIcon:'#7c3aed', menuIcons:'#475569', textDark:'#0f172a', textLight:'#fff', link:'#7c3aed', action:'#7c3aed', inactiveTabIcon:'#94a3b8', error:'#dc2626', inProgress:'#7c3aed', complete:'#059669' } }
    };
  }

  function normalizeInfo(info) {
    if (!info || typeof info !== 'object') throw new Error('Cloudinary tidak mengembalikan informasi file.');
    const secure_url=String(info.secure_url||'').trim();
    if(!secure_url) throw new Error('Upload Cloudinary selesai tetapi URL file tidak tersedia.');
    return { secure_url, public_id:info.public_id||'', original_filename:info.original_filename||info.filename||'File', width:Number(info.width)||null, height:Number(info.height)||null, version:info.version!=null?String(info.version):'', resource_type:info.resource_type||'image', format:info.format||'', bytes:Number(info.bytes)||0 };
  }

  function openImageWidget(options={},onSuccess,onError){
    const key=JSON.stringify(widgetConfig(options));
    return new Promise((resolve,reject)=>{
      if(!window.cloudinary || typeof window.cloudinary.createUploadWidget!=='function'){reject(new Error('Cloudinary Upload Widget belum dimuat.'));return;}
      let entry=queues.get(key);
      if(!entry){
        entry={pending:[],widget:null};
        entry.widget=window.cloudinary.createUploadWidget(widgetConfig(options),(error,result)=>{
          const job=entry.pending.shift();
          if(!job)return;
          if(error){job.reject(error);return;}
          if(result?.event==='success'){try{job.resolve(normalizeInfo(result.info));}catch(e){job.reject(e);}}
        });
        queues.set(key,entry);
      }
      entry.pending.push({resolve:info=>{onSuccess?.(info);resolve(info);},reject:error=>{onError?.(error);reject(error);}});
      try{entry.widget.open();}catch(e){entry.pending.pop();reject(e);}
    });
  }

  const openAvatarWidget=(s,e)=>openImageWidget({folder:(window.SYKA_CONFIG?.CLOUDINARY_FOLDER||'sykabelajar/users/profiles'),crop:true,croppingAspectRatio:1,maxFileSize:5000000},s,e);
  const openCompetitionImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/competitions/posters',maxFileSize:10000000,crop:true,croppingAspectRatio:16/9},s,e);
  const openPromoImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/home/promos',maxFileSize:10000000,crop:true,croppingAspectRatio:16/9},s,e);
  const openProductImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/store/products',maxFileSize:8000000,crop:true,croppingAspectRatio:1},s,e);
  const openPaymentProofWidget=(s,e)=>openImageWidget({folder:'sykabelajar/orders/payment-proofs',maxFileSize:8000000,crop:false},s,e);
  const openTwibbonWidget=(s,e)=>openImageWidget({folder:'sykabelajar/competitions/twibbon',maxFileSize:10000000,crop:true,croppingAspectRatio:1},s,e);

  window.SYKA_CLOUDINARY={openImageWidget,openAvatarWidget,openCompetitionImageWidget,openPromoImageWidget,openProductImageWidget,openPaymentProofWidget,openTwibbonWidget};
})();
