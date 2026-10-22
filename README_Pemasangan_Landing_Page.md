# SILAS — Landing Page Presentasi (Mobile-first)

Paket ini menambahkan landing page presentasi tanpa mengubah aplikasi SILAS yang sudah ada.

## Isi paket
- `landing.html` — halaman landing/presentasi.
- `landing.css` — desain responsif, warna navy, ivory, vermilion, dan emas lembut.
- `landing.js` — menu HP, navigasi aktif, splash intro, partikel hero, animasi saat scroll, dan dialog detail fitur.
- `assets/landing/` — logo Dayah Ruhul Qur’ani (kiri), logo BUD RQ (kanan), foto masjid eksterior sebagai background hero, foto interior masjid untuk bagian pengembangan, dan foto santri untuk bagian nilai pelayanan.

## Cara memasang di Windows
1. Buat salinan cadangan folder `D:\SILAS_Web`.
2. Ekstrak ZIP ini.
3. Salin `landing.html`, `landing.css`, `landing.js`, dan folder `assets\landing` ke folder utama `D:\SILAS_Web`.
4. Pastikan struktur akhirnya seperti ini:

   ```text
   D:\SILAS_Web\
   ├── index.html                 (aplikasi SILAS lama — jangan ditimpa)
   ├── app.js                     (jangan diubah)
   ├── styles.css                 (jangan diubah)
   ├── supabase-config.js         (jangan diubah)
   ├── landing.html
   ├── landing.css
   ├── landing.js
   └── assets\
       └── landing\
           ├── logo-bud-rq.jpg
           ├── logo-ruhul-qurani.png
           ├── santri-berkelompok.jpg
           └── masjid-senja.jpg
   ```

5. Jalankan server lokal seperti biasa, lalu buka `landing.html`. Jika sudah dihosting, buka URL `/landing.html`.
6. Tombol **Masuk Sistem** mengarah ke `./index.html`, yaitu aplikasi SILAS yang sudah ada.

## Catatan penting
- Paket ini tidak mengubah database, login, `app.js`, `styles.css`, atau `supabase-config.js` aplikasi utama.
- Untuk keamanan, landing page tidak memuat data santri, angka operasional, atau koneksi Supabase.
- Dashboard di bagian pratinjau adalah ilustrasi visual, bukan data produksi.
- Monitoring lintas-owner ditampilkan sebagai rencana pengembangan, bukan fitur yang sudah aktif.
- Google Fonts digunakan sebagai peningkatan tampilan; jika internet tidak tersedia, font fallback tetap digunakan.
- Saat mengunggah ke GitHub Pages, landing page bisa dibuka melalui `/landing.html`. Mengubah halaman default website menjadi landing page memerlukan keputusan terpisah agar `index.html` aplikasi tidak tertimpa.


## Revisi premium interaktif
- Splash intro otomatis saat landing page dibuka: logo Dayah Ruhul Qur’ani berputar, ring emas bergerak, dan ada tombol "Lewati pembuka".
- Kartu profil direktur dihapus sesuai keputusan desain agar hero lebih fokus pada identitas SILAS dan Dayah.
- Logo Dayah diposisikan di kiri dan logo BUD RQ di kanan pada header dan footer.
- Ornamen Jepang tipis, aksen vermilion/emas, dan partikel dekoratif bergerak dari bawah ke atas di area hero.
- Animasi dibuat responsif dan menghormati pengaturan `prefers-reduced-motion`.
- Foto direktur belum memiliki fitur upload melalui pengaturan aplikasi; placeholder dapat diganti ketika foto sudah tersedia. Pengaturan upload dinamis dapat dikembangkan terpisah setelah desain disetujui.


## Revisi foto dan ornamen Jepang
- Foto `IMG_20260509_062718.jpg` digunakan sebagai background hero utama.
- Foto `IMG_20260416_151724.jpg` digunakan pada bagian arah pengembangan sebagai visual interior masjid.
- Foto `IMG_20260809_041157.jpg` digunakan pada bagian "Nilai di Balik Layanan" sebagai visual santri.
- Foto sunset dan foto lainnya tidak dimasukkan agar landing page tidak terasa seperti galeri.
- Ornamen Jepang ditambah: pola asanoha/geometris, seigaiha/gelombang, siluet torii, cap kanji 誠, aksen sakura, aksen vermilion dan emas lembut, serta partikel bergerak.
- Kartu foto direktur tidak digunakan.
- Tetap pertahankan `index.html`, `app.js`, `styles.css`, dan `supabase-config.js` milik aplikasi utama. Landing page tetap terpisah.


## Revisi tambahan V2
- Bagian FITUR UTAMA, PRATINJAU SISTEM, dan ALUR KERJA diperkuat dengan latar yang lebih hidup:
  - gradasi ivory–biru lembut,
  - pola Jepang yang lebih terasa,
  - aksen emas dan vermilion,
  - kontras teks ditingkatkan.
- Bagian "Berangkat dari kebutuhan dayah" sekarang memakai foto santri, bukan foto tembok/interior masjid.
- Card dan blok teks diberi panel halus agar tidak menyatu dengan background.


## Revisi tambahan V3
- Hero diperluas dengan panel sorotan di sisi kanan agar tidak terasa kosong.
- Ditambahkan 4 kartu sorotan: Data Santri, PDF & Excel, Nyaman di HP, dan Lebih Terarah.
- Panel slogan diperbesar agar area hero lebih terisi dan lebih hidup.
- Versi HP diperbaiki:
  - hero dibuat satu kolom,
  - tombol ditumpuk vertikal,
  - kartu sorotan dibuat penuh lebar dan lebih mudah dibaca,
  - scroll cue dibuat lebih rapi di bagian bawah.


## Revisi final hero V4
- Menghapus susunan beberapa kartu kecil dari area hero.
- Mengganti area kanan dengan satu panel ringkasan yang lebih terstruktur.
- Panel berisi slogan, aksen Jepang, dan tiga poin ringkas: Data Santri, Tahap 1–8, serta Laporan.
- Tata letak desktop dibuat dua kolom yang seimbang.
- Pada HP, konten menjadi satu kolom dengan tombol berdampingan, tiga badge ringkas, dan satu panel yang dipadatkan.
- Hero mobile menggunakan tinggi berdasarkan isi, bukan minimum lebih dari 1.000 px, agar tidak memanjang tanpa kebutuhan.
- Ornamen Jepang dipertahankan sebagai aksen halus, bukan elemen yang bersaing dengan judul.
