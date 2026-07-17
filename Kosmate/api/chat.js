// /api/chat.js
// Serverless function (runs on Vercel). Menerima pesan dari AI Chat Assistant,
// lalu memanggil Google Gemini API (gratis) dengan API key yang disimpan aman
// di Environment Variable — TIDAK PERNAH dikirim ke browser.
//
// Env var yang wajib diisi di dashboard Vercel:
//   GEMINI_API_KEY   -> API key dari https://aistudio.google.com/app/apikey
// Opsional:
//   GEMINI_MODEL     -> default "gemini-2.0-flash"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di Environment Variables Vercel.' });
    return;
  }

  const { message, context } = req.body || {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Field "message" wajib diisi.' });
    return;
  }

  const ctx = context || {};
  const systemPrompt = `Kamu adalah AI Financial Advisor dalam aplikasi KosMate AI, asisten keuangan untuk anak kos dan mahasiswa di Indonesia.
Jawab singkat (maksimal 3-4 kalimat), ramah, praktis, dan gunakan Bahasa Indonesia santai namun sopan.
Data pengguna bulan ini:
- Nama: ${ctx.name || 'Pengguna'}
- Pemasukan bulan ini: Rp ${Number(ctx.income || 0).toLocaleString('id-ID')}
- Pengeluaran bulan ini: Rp ${Number(ctx.expense || 0).toLocaleString('id-ID')}
- Target tabungan: "${ctx.goalName || '-'}" (Rp ${Number(ctx.goalCurrent || 0).toLocaleString('id-ID')} dari Rp ${Number(ctx.goalTarget || 0).toLocaleString('id-ID')})
Berikan saran yang relevan dan spesifik dengan pertanyaan pengguna, memakai data di atas jika relevan.`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      res.status(502).json({ error: 'Gagal menghubungi AI. Coba lagi sebentar lagi.' });
      return;
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
      'Maaf, aku belum bisa menjawab itu sekarang. Coba tanya dengan cara lain ya!';

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat function error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan di server.' });
  }
}
