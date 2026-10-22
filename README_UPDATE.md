# SILAS Premium Dashboard Update

## What changed
- Dashboard desktop: director card is positioned in the right column beside the period overview.
- Dashboard mobile: director card becomes a full-width, touch-friendly card with photo above the name, role, and quote.
- Summary and quick-action cards have premium gradients, softer shadows, and hover states.
- Laundry records table now has an **Aksi / Hapus** column.
- Deleting a record asks for confirmation, deletes only the selected row from `catatan_laundry`, then reloads stage totals and dashboard summaries.

## Apply update
1. Back up your current SILAS folder.
2. Copy `index.html`, `app.js`, `styles.css`, and `assets/` from this package into your current project, replacing files with the same names.
3. Keep your existing `supabase-config.js`; it is intentionally not included here.
4. Run `npx serve .` and test with a test record first.
5. Push the updated files to GitHub to update GitHub Pages.

## Deleting laundry records
The delete button removes one `catatan_laundry` row after confirmation. It is a permanent action and affects report totals. The logged-in user must have DELETE permission under Supabase RLS. The RLS policy created earlier for authenticated users allows it; if your policies were changed, verify the delete permission in Supabase.

## Note
This package was syntax-checked with Node.js (`node --check app.js`) but was not connected to the user's live Supabase project during testing.


## Revisi animasi login SILAS
- Saat halaman login tampil, dua panel pintu bergerak dari tengah ke samping.
- Form login ditampilkan sebagai kartu premium biru-putih dengan aksen emas.
- Setelah Supabase memverifikasi email dan password dengan benar, kartu login dianimasikan seperti kertas sobek.
- Setelah efek sobek, dashboard muncul di balik dua panel pintu yang kemudian terbuka.
- Kredensial salah tetap menampilkan pesan kesalahan dan tidak menjalankan animasi masuk dashboard.
- Menambahkan dukungan `prefers-reduced-motion` untuk pengguna yang memilih animasi minimal.
- Tidak ada perubahan skema database atau konfigurasi Supabase.
