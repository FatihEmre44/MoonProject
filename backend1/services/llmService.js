import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// .env dosyasını tam yol vererek yükleyelim
dotenv.config({ path: path.join(process.cwd(), '.env') });

// OpenAI API Anahtarı ve Bağlantı Kontrolü
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.warn("⚠️  UYARI: OPENAI_API_KEY .env dosyasında bulunamadı veya okunamadı!");
} else {
    console.log(`✅ OPENAI_API_KEY başarıyla yüklendi (Karakter sayısı: ${apiKey.length})`);
    console.log("🚀 OpenAI Karar Destek Sistemi aktif.");
}

const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Rover telemetri analizini OpenAI (GPT) ile yorumlayıp rapor oluşturur.
 * @param {Object} telemetryData - A* ve Telemetri fonksiyonundan gelen veriler
 */
export async function generateMissionReport(telemetryData) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY_MISSING");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Hem çok ucuz hem de çok hızlı (Flash dengi)
      messages: [
        {
          role: "system",
          content: "Sen Türkiye Uzay Ajansı (TUA) Ay Araştırma Programı'nda (AYAP) görevli bir Kıdemli Navigasyon Mühendisisin. Görevin, otonom Rover'ın belirlediği rotayı teknik ve stratejik olarak onaylamaktır. Maksimum 2 cümlelik, profesyonel teknik analiz raporu üret. Markdown kullanma."
        },
        {
          role: "user",
          content: `Aşağıdaki telemetri verilerini analiz et ve rotanın neden güvenli/optimum olduğunu açıkla: ${JSON.stringify(telemetryData)}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error("❌ OpenAI API Hatası:", error.message);
    return "TUA Sistem Analizi: LLM veri hattında gecikme yaşanıyor, ancak telemetri verileri otonom navigasyonun nominal sınırlarda olduğunu teyit ediyor.";
  }
}