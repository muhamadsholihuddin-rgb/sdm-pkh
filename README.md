# PKH Tools — Frontend (Kabupaten Kediri)

Frontend statis (HTML/CSS/JS biasa, tanpa framework) untuk aplikasi PKH Tools.
Backend/database-nya tetap Google Sheets + Apps Script yang sudah dibuat sebelumnya.

## Struktur file
- `index.html` — struktur halaman (login, ganti password, form identitas/keluarga/wilayah)
- `style.css` — semua tampilan/warna (tema navy/amber)
- `config.js` — **isi URL Apps Script kamu di sini**
- `app.js` — logika (fetch ke Apps Script, isi form, dst.)
- `manifest.json` + `sw.js` + folder `icons/` — supaya aplikasi bisa di-"Install" ke HP seperti aplikasi native (PWA). Semua file ini (termasuk folder `icons` beserta isinya) harus ikut di-upload ke GitHub, strukturnya jangan diubah.

## Langkah 1 — Pastikan Apps Script sudah punya `doPost`
Buka Apps Script (Extensions > Apps Script di Google Sheets kamu), pastikan `Code.gs`
sudah versi terbaru yang ada fungsi `doPost`. Kalau belum, tempel ulang dari file
`Code.gs` yang sudah dikirim.

**Penting:** setiap kali kamu ubah `Code.gs`, jangan bikin "New deployment" baru
(itu bikin URL berubah). Pakai **Deploy > Manage deployments > (pilih deployment
yang ada) > Edit (ikon pensil) > Version: New version > Deploy**. Dengan cara ini
URL-nya tetap sama, jadi `config.js` di frontend tidak perlu diubah-ubah.

## Langkah 2 — Isi `config.js`
Buka `config.js`, pastikan `APPS_SCRIPT_URL` isinya URL Apps Script kamu yang
diakhiri `/exec`, contoh:
```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

## Langkah 3 — Push ke GitHub
1. Buat repository baru di GitHub (bisa lewat web, tidak perlu command line kalau belum terbiasa — tinggal drag & drop keempat file di atas lewat tombol "Add file > Upload files" di halaman repo GitHub)
2. Upload `index.html`, `style.css`, `config.js`, `app.js` ke root repository (bukan di dalam folder)

## Langkah 4 — Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com), login pakai akun GitHub kamu
2. Klik "Add New" > "Project"
3. Pilih repository yang tadi kamu buat
4. Framework Preset: pilih **"Other"** (karena ini bukan React/Next.js, cuma HTML biasa)
5. Klik "Deploy" — tidak perlu ubah setting apa pun yang lain
6. Setelah selesai (sekitar 1 menit), Vercel kasih link, misal `https://pkh-kediri.vercel.app` — itu link final yang dibagikan ke 202 pendamping

## Update di kemudian hari
- **Ubah tampilan/warna** → edit `style.css`, push ulang ke GitHub → Vercel otomatis deploy ulang
- **Ubah alur/logika** → edit `app.js`
- **Ubah field/struktur data** → perlu ubah dua sisi: `Code.gs` (server) dan `app.js` + `index.html` (tampilan)

## Kalau ada error "Gagal terhubung ke server"
Kemungkinan penyebab, urut dari yang paling sering:
1. `APPS_SCRIPT_URL` di `config.js` salah ketik atau belum diisi
2. Apps Script belum di-deploy ulang setelah ada perubahan `Code.gs`
3. Setting akses deployment Apps Script bukan "Anyone" — cek di Deploy > Manage deployments
