# MoonProject

MoonProject, Ay yüzeyinde otonom rover rotasını risk, enerji tüketimi ve arazi zorluklarına göre optimize eden bir karar destek simülasyonudur. Frontend, backend ve AI raporlama entegrasyonu ile gerçek zamanlı rota planlama ve görselleştirme sunar.

## Proje Klasör Yapısı

- backend1/ : Node.js + Express API, A* rota hesaplama, telemetri, LLM tabanlı raporlama.
- frontend1/ : Vite + React + Three.js tabanlı 3B Ay yüzeyi simülasyonu, HUD ve mini harita.
- SUNUM_SAYFASI.md : Proje açıklaması, teknik mimari, veri kaynakları ve referanslar.

## Teknolojiler

- Frontend: React 19, Vite 7, Three.js, @react-three/fiber, @react-three/drei, framer-motion
- Backend: Node.js (ES Modules), Express 5, CORS, dotenv
- AI: OpenAI Chat Completions (gpt-4o-mini) ile görev değerlendirme raporu
- Algoritma: A* ve çoklu A* (astarMulti) ile güvenli rota planlama

## Çalıştırma

1. Backend:

`Bash
cd backend1
npm install
npm start
`

2. Frontend:

`Bash
cd frontend1
npm install
npm run dev
`

3. Tarayıcıda http://localhost:5173 (veya Vite çıktısı) adresini açın.

## Özellikler

- 200x200 grid harita, kraterler, eğim ve engebelilik ile sahanın modellemesi
- A* tabanlı en düşük maliyetli/güvenli rota seçimi
- Batarya ve risk telemetri skoru hesaplaması
- AI temelli görev raporları ve jürili teknik özet
- Çizim: 2D/3D rotalar, ışıklandırma, kamera kontrol ve HUD

---------------------------------------------------------------------------------

Bu proje, 48 saatlik bir hackathon maratonu kapsamında sıfırdan geliştirilmiştir.
