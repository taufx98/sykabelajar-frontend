# GitHub Actions → fingerprint → jsDelivr

Sykabelajar memakai satu URL loader yang stabil di Blogger:

`https://cdn.jsdelivr.net/gh/taufx98/sykabelajar-frontend@main/dist/loader.js`

Source frontend tetap berada di `src/`. Setiap push ke `main` menjalankan:

1. `node build/build.mjs`
2. hash/fingerprint untuk `app`, `styles`, dan `vendor`
3. generate `dist/loader.js`
4. generate `dist/manifest.json`
5. commit hasil `dist/` kembali ke `main` menggunakan `[skip ci]`
6. purge cache jsDelivr untuk `loader.js`

Blogger hanya perlu memuat `loader.js` satu kali. Loader menunjuk ke asset fingerprinted terbaru, misalnya:

- `app.655c45acfbb8.min.js`
- `styles.b9d1287450c7.min.css`
- `vendor.cf40974afa79.min.js`

Karena filename berubah ketika isi berubah, asset aplikasi tidak bergantung pada cache lama dari branch alias. Hanya loader yang memakai `@main`, dan workflow otomatis meminta purge cache setelah publish.

## Workflow developer

```bash
git add .
git commit -m "feat: ..."
git push origin main
```

Setelah GitHub Actions selesai, Blogger tidak perlu diedit lagi.

## Catatan

`@main` pada loader memang sengaja dipakai sebagai deployment pointer. jsDelivr sendiri menyatakan branch references dapat di-cache, sehingga workflow melakukan purge terhadap URL loader setelah generated assets dipush. Asset fingerprinted tidak perlu dipurge karena URL-nya unik untuk setiap isi.
