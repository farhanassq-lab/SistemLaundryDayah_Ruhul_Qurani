SILAS V13 — PENOMORAN ULANG PERIODE OTOMATIS

Perubahan:
- Setelah periode dihapus, semua periode tersisa otomatis dinomori ulang 1, 2, 3, ...
- ID periode tidak berubah. Data tahap/catatan pada periode yang tersisa tetap terkait dengan periode yang sama.
- Tampilan keberhasilan penghapusan menyebutkan bahwa urutan periode telah diperbarui.

CARA MEMASANG:
1. Buka Supabase Dashboard > SQL Editor pada project SILAS.
2. Buka file sql/06_urutkan_periode_setelah_hapus.sql, salin seluruh isinya, lalu jalankan satu kali.
3. Di GitHub, ganti app.js dengan app.js dari paket ini, lalu commit.
4. sistem.html tidak berubah; tidak wajib diganti.
5. Refresh website.

CATATAN:
- Migrasi SQL wajib dijalankan agar fungsi penghapusan di database melakukan penomoran ulang.
- SQL ini menggantikan fungsi RPC silas_hapus_periode yang sudah ada; tidak perlu menjalankan ulang SQL lama 05_hapus_periode.sql.
- Migrasi menambahkan izin UPDATE khusus pada tabel periode agar fungsi SECURITY INVOKER dapat menyusun ulang nomor saat RLS aktif.
- Sebelum menghapus periode, unduh PDF yang masih dibutuhkan karena catatan laundry pada periode yang dihapus ikut terhapus.
