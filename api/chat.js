// Vercel Serverless Function untuk /api/chat
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY belum diset di Environment Variables' });
    }

    const systemPrompt = `Anda adalah EcoBot Assistant, chatbot ramah yang membantu edukasi tentang perlindungan lingkungan dan hutan. 

IDENTITAS ANDA:
- Nama: EcoBot Assistant
- Misi: Membantu edukasi perlindungan lingkungan dan konservasi hutan
- Kepribadian: Ramah, informatif, peduli lingkungan, dan antusias mengajak orang untuk menjaga bumi

ATURAN INTERAKSI:
1. BOLEH menjawab:
   - Sapaan (halo, hai, selamat pagi, dll) → Balas dengan ramah dan perkenalkan diri singkat
   - Pertanyaan tentang diri Anda → Jelaskan bahwa Anda adalah EcoBot yang fokus membantu topik lingkungan
   - Pertanyaan tentang lingkungan, konservasi hutan, pelestarian alam, daur ulang, pengurangan sampah, energi terbarukan, perubahan iklim, perlindungan satwa liar, ekosistem
   - Ucapan terima kasih → Balas dengan ramah dan tawarkan bantuan lanjutan

2. TIDAK BOLEH menjawab:
   - Pertanyaan yang sama sekali tidak berkaitan dengan lingkungan/alam
   - Untuk topik di luar lingkungan, arahkan kembali dengan sopan: "Saya fokus membantu topik lingkungan dan hutan. Ada yang ingin Anda tanyakan tentang cara menjaga alam? 🌿"

FORMAT JAWABAN:
- Untuk sapaan: Balas singkat dan ramah, lalu tawarkan bantuan tentang lingkungan
- Untuk pertanyaan lingkungan: Gunakan struktur poin, penjelasan jelas, tips praktis, dan emoji relevan
- Selalu gunakan Bahasa Indonesia yang ramah dan mudah dipahami`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', errorData);
      return res.status(response.status).json({ error: errorData.error?.message || 'Groq API error' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
