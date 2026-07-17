# KosMate AI — Panduan Setup & Hosting (Gratis)

Aplikasi ini punya 3 bagian:
1. **`index.html`** — seluruh tampilan & logika aplikasi (frontend)
2. **`api/chat.js`** — fungsi backend kecil yang menjawab AI Chat Assistant
3. **Supabase** — database + sistem login untuk banyak pengguna (multi-user)

Sebelum di-setup, `index.html` akan otomatis berjalan dalam **Mode Demo** (data tersimpan sementara di memori browser, hilang saat refresh). Ikuti langkah di bawah untuk mengaktifkan database & login sungguhan.

Total waktu: sekitar 20–30 menit, semuanya gratis, tidak perlu kartu kredit.

---

## Langkah 1 — Buat Database di Supabase

1. Buka [supabase.com](https://supabase.com) → **Start your project** → daftar/login (bisa pakai akun GitHub/Google).
2. Klik **New Project**. Isi nama project (mis. `kosmate-ai`), buat password database (simpan, tidak perlu dihafal), pilih region terdekat (mis. Singapore), lalu **Create new project**. Tunggu ±2 menit sampai project siap.
3. Di sidebar kiri, klik **SQL Editor** → **New query**.
4. Buka file `supabase-schema.sql` yang ada di folder ini, **copy semua isinya**, tempel ke SQL Editor, lalu klik **Run**. Ini akan membuat 3 tabel (`profiles`, `goals`, `transactions`) lengkap dengan aturan keamanan (setiap pengguna hanya bisa lihat datanya sendiri) dan otomatisasi (akun baru otomatis dapat target tabungan default).
5. Buka **Project Settings** (ikon gerigi) → **Data API**. Catat dua nilai ini:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public key** (di bagian Project API keys — key yang panjang, bukan `service_role`)
6. (Opsional tapi disarankan untuk tugas kuliah) Supaya bisa langsung login tanpa perlu klik link konfirmasi email: buka **Authentication → Sign In / Providers → Email**, matikan **"Confirm email"**. Untuk aplikasi publik sungguhan sebaiknya dinyalakan lagi, tapi untuk demo/tugas ini mempermudah testing.

---

## Langkah 2 — Sambungkan Frontend ke Supabase

1. Buka file `index.html` dengan text editor.
2. Cari bagian ini di dekat awal tag `<script>`:
   ```js
   const CONFIG = {
     SUPABASE_URL: 'YOUR_SUPABASE_URL',
     SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
   };
   ```
3. Ganti dengan nilai dari Langkah 1 tadi, contoh:
   ```js
   const CONFIG = {
     SUPABASE_URL: 'https://xxxxx.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOiJI...',
   };
   ```
4. Simpan file. Begitu dua nilai ini diisi, aplikasi **otomatis keluar dari Mode Demo** dan menampilkan halaman **Masuk / Daftar** sungguhan — ini yang memberi kamu fitur ganti-ganti akun (multi-user).

---

## Langkah 3 — API Key AI Chat (Gemini, Gratis)

1. Buka [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), login dengan akun Google.
2. Klik **Create API key** → pilih/buat project baru → key akan muncul. Copy key ini. Tidak butuh kartu kredit untuk tier gratis.
3. Simpan key ini, dipakai di Langkah 4 (jangan ditaruh di `index.html` — itu file publik yang bisa dilihat siapa saja, key harus disimpan di server/Vercel saja).

---

## Langkah 4 — Deploy ke Vercel (Hosting Gratis)

1. Buka [vercel.com](https://vercel.com) → daftar/login (paling mudah pakai akun GitHub).
2. **Cara termudah tanpa GitHub:** install Vercel CLI di komputer kamu:
   ```bash
   npm install -g vercel
   ```
   Lalu masuk ke folder project ini di terminal dan jalankan:
   ```bash
   vercel
   ```
   Ikuti pertanyaan yang muncul (pilih akun, nama project, terima default lainnya). Setelah selesai kamu akan dapat URL seperti `https://kosmate-ai.vercel.app`.

   **Atau lewat GitHub (kalau tugas perlu dinilai berkelanjutan):** upload folder ini jadi repository baru di GitHub, lalu di Vercel klik **Add New → Project → Import Git Repository**, pilih repo tadi, klik **Deploy**.
3. Setelah project ada di Vercel, buka **Project → Settings → Environment Variables**. Tambahkan:
   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | (key dari Langkah 3) |
4. Klik **Save**, lalu buka tab **Deployments** → titik tiga (⋯) pada deployment terakhir → **Redeploy**, supaya environment variable baru terpakai.
5. Buka URL Vercel kamu. Coba **Daftar** akun baru, login, catat beberapa transaksi, dan coba **AI Chat Assistant** — sekarang jawabannya benar-benar dari AI (Gemini), bukan lagi jawaban template.

---

## Cara "Ganti-Ganti User"

Karena sekarang pakai Supabase Auth sungguhan:
- Setiap orang **daftar akun sendiri** (email + password) di halaman awal.
- Data transaksi, target tabungan, dan nama tersimpan **terpisah per akun** (dijamin oleh Row Level Security di database — user A tidak akan pernah bisa melihat data user B).
- Untuk pindah akun: buka **Profil → Keluar**, lalu **Masuk** dengan akun lain (atau **Daftar** akun baru).

---

## Struktur File

```
kosmate-ai-webapp/
├── index.html            ← Frontend (UI, chart, logika aplikasi)
├── api/
│   └── chat.js            ← Backend function untuk AI Chat (dipanggil otomatis oleh frontend)
├── supabase-schema.sql    ← Jalankan sekali di Supabase SQL Editor
├── package.json
└── README.md              ← File ini
```

## Troubleshooting Cepat

- **Login/daftar tidak jalan sama sekali** → cek lagi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `index.html`, pastikan tidak ada spasi/tanda kutip yang salah.
- **Daftar berhasil tapi tidak bisa langsung masuk** → berarti "Confirm email" masih aktif di Supabase (lihat Langkah 1 poin 6), matikan atau cek email untuk link konfirmasi.
- **AI Chat menjawab tapi jawabannya generik/template** → berarti `/api/chat` gagal dipanggil (mungkin `GEMINI_API_KEY` belum diisi di Vercel, atau lupa redeploy setelah menambah env var) — aplikasi otomatis jatuh ke jawaban cadangan supaya fitur tidak pernah error total, tapi cek Vercel → Deployments → Logs untuk pesan errornya.
- **Mau tes dulu tanpa setup apa pun** → cukup buka `index.html` langsung di browser, otomatis jalan di Mode Demo.
