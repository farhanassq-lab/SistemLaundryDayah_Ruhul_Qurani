# SILAS | Laundry Santri Dayah Ruhul Qur’ani

Paket revisi untuk situs statis SILAS dan proyek Supabase yang sudah menjalankan SILAS. `index.html` membuka aplikasi di `sistem.html`. Halaman publik tersedia di `landing.html`.

## Pasang revisi

1. Cadangkan database dan simpan versi GitHub yang saat ini berfungsi. Gunakan proyek Supabase uji jika tersedia.
2. Di Supabase SQL Editor, jalankan `sql/02_check_schema.sql`. Hasil harus memuat enam tabel inti SILAS. Paket ini memerlukan skema inti yang sudah ada.
3. Jika kolom `nomor_periode` atau tabel `pengaturan_laporan` belum ada, jalankan `sql/03_periode_dan_pengaturan.sql`. Jalankan `sql/04_profil_direktur.sql` jika tabel pengaturan lama belum punya kolom profil direktur.
4. Jalankan `sql/05_laporan_masalah.sql` untuk membuat atau memeriksa modul foto dan laporan. Lanjutkan langsung ke `sql/06_silas_revisi.sql` untuk menerapkan aturan akses baru. Jangan menjalankan migrasi 03–05 lagi setelah 06 tanpa menjalankan 06 kembali.
5. Masukkan peran untuk akun yang sudah ada di **Authentication → Users**. Gunakan UUID akun dan ubah contoh berikut di SQL Editor.

   ```sql
   insert into public.silas_anggota (user_id, peran)
   values ('00000000-0000-0000-0000-000000000000', 'admin')
   on conflict (user_id) do update set peran = excluded.peran;
   ```

   Ulangi dengan `petugas` atau `pimpinan` untuk akun lain. Hapus baris keanggotaan untuk mencabut akses. Akun tanpa peran tetap dapat masuk lewat Auth, tetapi database SILAS menolak aksesnya. Verifikasi bahwa proyek menonaktifkan pendaftaran umum jika pengurus membuat semua akun secara internal.
6. Periksa `supabase-config.js`. Gunakan URL proyek dan publishable key atau anon key. Simpan secret key dan service-role key di lingkungan server.
7. Ekstrak ZIP dan unggah **isi paket** ke folder yang dipublikasikan GitHub Pages. Untuk repo lama, ganti `index.html`, `sistem.html`, `app.js`, dan aset lain dengan versi paket. Konfigurasi hosting tetap menggunakan folder publikasi repo yang sudah aktif.

## Hak akses

| Peran | Akses |
|---|---|
| Admin | Seluruh layar, pengaturan kop PDF, dan penghapusan catatan atau laporan masalah. |
| Petugas | Dashboard, input, data santri, jadwal, tutup tahap, rekap PDF, serta pencatatan dan tindak lanjut masalah. |
| Pimpinan | Dashboard, rekap PDF, dan riwayat masalah dalam mode baca. |

Tahap yang ditutup tetap tersedia di PDF. Penghapusan tahap dan periode dinonaktifkan untuk akun aplikasi agar riwayat tetap utuh. Nomor periode mengikuti nomor yang tersimpan saat revisi dipasang. Migrasi ini tidak dapat memulihkan nomor yang sudah digeser oleh versi lama.

## Uji setelah pemasangan

- Login dengan masing-masing peran dan satu akun tanpa peran.
- Catat dua santri pada tahap yang sama. Periksa NIS, kamar, dan tahap yang tetap dipilih setelah menyimpan.
- Tutup tahap, lalu coba pencatatan baru dari sesi kedua yang belum dimuat ulang. Database harus menolaknya.
- Buat laporan masalah dengan foto. Periksa filter nama, kamar, tanggal, status, dan halaman berikutnya.
- Cocokkan ringkasan periode dan PDF dengan jumlah santri, berat, dan pakaian di database. Uji periode yang menghasilkan lebih dari 200 baris.
- Uji akses foto dan pengaturan dari ketiga peran. Jika proyek memakai kebijakan restrictive lama atau RPC kustom, periksa juga kebijakan dan izin fungsi tersebut.
