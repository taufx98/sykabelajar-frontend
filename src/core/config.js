(function () {
  const existing = window.SYKA_CONFIG || {};
  window.SYKA_CONFIG = Object.freeze({
    APP_NAME: 'Sykabelajar.id',
    APP_VERSION: '4.13.0-control-plane',
    ROUTE_MODE: existing.ROUTE_MODE || 'query',
    APP_PAGE: existing.APP_PAGE || '/p/app.html',
    ASSET_BASE_URL: existing.ASSET_BASE_URL || './dist',
    SUPABASE_URL: existing.SUPABASE_URL || 'https://jrfogwueytiddnanetth.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: existing.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_H3zjdAEE-ItQ08YRj8MieQ_kNMcsAHa',
    CLOUDINARY_CLOUD_NAME: existing.CLOUDINARY_CLOUD_NAME || 'sykabelajar',
    CLOUDINARY_UPLOAD_PRESET: existing.CLOUDINARY_UPLOAD_PRESET || 'sykabelajar_preset',
    CLOUDINARY_FOLDER: existing.CLOUDINARY_FOLDER || 'sykabelajar/users/profiles',
    CLOUDINARY_FOLDERS: {
      profile: 'sykabelajar/users/profiles',
      competition: 'sykabelajar/competitions/posters',
      promo: 'sykabelajar/home/promos',
      product: 'sykabelajar/store/products',
      paymentProof: 'sykabelajar/orders/payment-proofs',
      twibbon: 'sykabelajar/competitions/twibbon'
    },
    DEFAULT_PAGE_SIZE: 12,
    PROFILE_COLUMNS: {
      avatarUrl: 'avatar_url',
      avatarPublicId: 'avatar_public_id',
      avatarWidth: 'avatar_width',
      avatarHeight: 'avatar_height',
      avatarVersion: 'avatar_version',
      avatarResourceType: 'avatar_resource_type'
    }
  });
})();


