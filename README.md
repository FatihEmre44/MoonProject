# MoonProject

MoonProject, Ay yüzeyinde otonom rover rotasýný risk, enerji tüketimi ve arazi zorluklarýna göre optimize eden bir karar destek simülasyonudur. Frontend, backend ve AI raporlama entegrasyonu ile gerçek zamanlý rota planlama ve görselleþtirme sunar.

## Proje Klasör Yapýsý

- ackend1/ : Node.js + Express API, A* rota hesaplama, telemetri, LLM tabanlý raporlama.
- rontend1/ : Vite + React + Three.js tabanlý 3B Ay yüzeyi simülasyonu, HUD ve mini harita.
- PROJE_SAYFASI.md : Proje açýklamasý, teknik mimari, veri kaynaklarý ve referanslar.

## Teknolojiler

- Frontend: React 19, Vite 7, Three.js, @react-three/fiber, @react-three/drei, framer-motion
- Backend: Node.js (ES Modules), Express 5, CORS, dotenv
- AI: OpenAI Chat Completions (gpt-4o-mini) ile görev deðerlendirme raporu
- Algoritma: A* ve çoklu A* (astarMulti) ile güvenli rota planlama

## Çalýþtýrma

1. Backend:

`ash
cd backend1
npm install
npm start
`

2. Frontend:

`ash
cd frontend1
npm install
npm run dev
`

3. Tarayýcýda http://localhost:5173 (veya Vite çýktýsý) adresini açýn.

## Özellikler

- 200x200 grid harita, kraterler, eðim ve engebelilik ile sahanýn modellemesi
- A* tabanlý en düþük maliyetli/güvenli rota seçimi
- Batarya ve risk telemetri skoru hesaplamasý
- AI temelli görev raporlarý ve jürili teknik özet
- Çizim: 2D/3D rotalar, ýþýklandýrma, kamera kontrol ve HUD

## Katký

1. Depoyu fork edin
2. Yeni bir branch oluþturun (örn. eat/path-optimization)
3. Deðiþiklikleri commit edin
4. Pull request oluþturun

## Lisans

Proje için uygun lisans seçin (örn. MIT veya Apache 2.0).
