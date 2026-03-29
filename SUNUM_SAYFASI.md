# 4.4 Proje Sayfasi Anatomisi - MoonProject

## 1. Ozet (Executive Summary)
MoonProject, Ay yuzeyinde otonom rover rotasini risk, enerji tuketimi ve arazi zorluguna gore optimize eden bir karar destek simulasyonudur. Sistem, A* tabanli yol planlamayi 3D gorsellestirme ve yapay zeka tarafindan uretilen kisa gorev raporlariyla birlestirerek juriye teknik ve operasyonel resmi ayni ekranda sunar. Sonuc olarak proje, yalnizca yol bulan degil, secilen yolun neden guvenli ve uygulanabilir oldugunu aciklayan bir uzay gorev prototipi ortaya koyar.

## 2. Teknik Detaylar
### Kullanilan Teknolojiler
- Frontend: React 19, Vite 7, Three.js, @react-three/fiber, @react-three/drei, framer-motion
- Backend: Node.js (ES Modules), Express 5, CORS, dotenv
- AI Servisi: OpenAI Chat Completions (gpt-4o-mini) ile gorev yorumu/raporlama

### Yazilim Dilleri
- JavaScript (frontend + backend)
- JSON (API veri tasima)

### Mimari Yapi
- Iki katmanli mimari kullanilmistir:
- Frontend (frontend1): 3D Ay arazisi, krater/engel modeli, rota ve HUD gosterimi
- Backend (backend1): rota planlama, telemetri hesaplama, AI tabanli gorev raporu uretimi

### Projenin Calisma Prensibi
1. Frontend, 200x200 grid tabanli haritayi (krater, egim, engebeli alan) olusturur ve baslangic/hedef(ler) bilgisiyle backend API'sine gonderir.
2. Backend, `astar` ve `astarMulti` algoritmalari ile en uygun/guvenli rotayi hesaplar.
3. Rota sonucu uzerinden telemetri modulu batarya tuketimi, risk skoru ve tehlikeli bolge metriklerini cikarir.
4. LLM servisi telemetriyi teknik bir gorev degerlendirme metnine donusturur ve API yanitina ekler.
5. Frontend, rotayi 2D/3D olarak gosterir; juri hem sayisal metrikleri hem de yorumlanmis AI raporunu birlikte gorur.

## 3. Veri Kaynaklari
### Projede Kullanilan Veri Yaklasimi
- Mevcut prototipte harita verisi sentetik ve deterministik uretilmektedir (krater yaricapi, egim ve engebelilik katmanlari).
- Bu tercih, algoritma dogrulamasi ve senaryo testlerinin tekrarlanabilir olmasi icin yapilmistir.

### Atif Verilen Uzay Ajansi Kaynaklari
- TUA (Turkiye Uzay Ajansi): Milli Uzay Programi ve AYAP baglami
  - https://tua.gov.tr
- NASA PDS Geosciences Node (Moon): Ay jeolojisi/topografya veri kataloglari
  - https://pds-geosciences.wustl.edu/missions/lro/
- NASA LRO / LOLA (Lunar Orbiter Laser Altimeter): Ay yukseklik ve egim cikarsama icin temel referans
  - https://lola.gsfc.nasa.gov
- ESA Planetary Science Archive (PSA): Planetary veri erisimi ve meta-veri kataloglari
  - https://www.cosmos.esa.int/web/psa

Not: Bu surumde canli ajans verisi dogrudan cekilmemekte, ancak sistem mimarisi bu veri kaynaklarindan alinacak DEM/krater katmanlarini `mapGrid` ve `craterMap` formatina donusturecek sekilde tasarlanmistir.

## 5. AI Beyani
- Yapay zeka, yalnizca "karar aciklama ve gorev raporu olusturma" amaciyla kullanilmistir.
- Rota hesaplama ve guvenlik karari cekirdek olarak deterministik A* ve telemetri kurallariyla uretilir.
- AI ciktilari operasyonel ozet/narratif katmanidir; temel navigasyon sonucunu tek basina belirlemez.
- Kullanilan AI alani: telemetri verisini juriye okunabilir teknik analize donusturme.

## Referanslar ve Linkler
- Proje kodu (GitHub): https://github.com/FatihEmre44/MoonProject
- Backend API giris noktasi: backend1/server.js
- Rota algoritmasi: backend1/utils/astar.js
- Telemetri modulu: backend1/utils/telemetry.js
- AI servis katmani: backend1/services/llmService.js
- Frontend harita veri uretimi: frontend1/src/utils/buildMapData.js
