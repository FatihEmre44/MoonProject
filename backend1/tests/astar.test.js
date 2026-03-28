/**
 * A* Algoritması — Detaylı Test Suite (v2)
 * Yeni dönüş formatı: { path, totalCost, stats }
 * Çalıştır: node tests/astar.test.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import astar from '../utils/astar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: '✅ PASSED' });
  } catch (err) {
    failed++;
    results.push({ name, status: '❌ FAILED', error: err.message });
  }
}

function assertEqual(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg}\n   Beklenen: ${e}\n   Gelen:    ${a}`);
  }
}

function assertNotNull(actual, msg = '') {
  if (actual === null || actual === undefined) {
    throw new Error(`${msg} — null/undefined döndü`);
  }
}

function assertNull(actual, msg = '') {
  if (actual !== null) {
    throw new Error(`${msg}\n   null bekleniyordu ama dönen: ${JSON.stringify(actual)}`);
  }
}

function assertPathValid(path, grid, start, end, msg = '') {
  assertEqual(path[0], start, `${msg} — Başlangıç noktası yanlış`);
  assertEqual(path[path.length - 1], end, `${msg} — Bitiş noktası yanlış`);

  for (let i = 1; i < path.length; i++) {
    const [pr, pc] = path[i - 1];
    const [cr, cc] = path[i];
    const dist = Math.max(Math.abs(pr - cr), Math.abs(pc - cc));
    if (dist !== 1) {
      throw new Error(
        `${msg} — Adım ${i} komşu değil: [${pr},${pc}] → [${cr},${cc}]`
      );
    }
  }

  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    if (grid[r][c] === 1) {
      throw new Error(`${msg} — Yol engel üzerinden geçiyor: [${r},${c}]`);
    }
  }
}

console.log('═══════════════════════════════════════════════');
console.log('  A* ALGORİTMASI — DETAYLI TEST SUITE (v2)');
console.log('  Dönüş formatı: { path, totalCost, stats }');
console.log('═══════════════════════════════════════════════\n');

// ═══════════════════════════════════════
// GRUP 1: TEMEL FONKSİYONELLİK
// ═══════════════════════════════════════
console.log('📦 GRUP 1: Temel Fonksiyonellik\n');

test('1.1 — Basit düz yol (engelsiz 3x3)', () => {
  const grid = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [2, 2]);
  assertNotNull(result, 'Yol bulunmalıydı');
  assertPathValid(result.path, grid, [0, 0], [2, 2]);
  assertEqual(result.path.length, 3, 'Yol uzunluğu çapraz adımlarla 3 olmalı');
});

test('1.2 — Aynı noktaya gitme (start === end)', () => {
  const grid = [
    [0, 0],
    [0, 0],
  ];
  const result = astar(grid, [0, 0], [0, 0]);
  assertNotNull(result, 'Aynı noktaya yol bulunmalı');
  assertEqual(result.path.length, 1, 'Yol tek bir nokta olmalı');
  assertEqual(result.path[0], [0, 0]);
  assertEqual(result.totalCost, 0, 'Aynı noktada maliyet 0 olmalı');
  assertEqual(result.stats.stepCount, 0, 'Adım sayısı 0 olmalı');
});

test('1.3 — Yatay düz yol', () => {
  const grid = [[0, 0, 0, 0, 0]];
  const result = astar(grid, [0, 0], [0, 4]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [0, 4]);
  assertEqual(result.path.length, 5);
  assertEqual(result.totalCost, 4);
});

test('1.4 — Dikey düz yol', () => {
  const grid = [[0], [0], [0], [0], [0]];
  const result = astar(grid, [0, 0], [4, 0]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [4, 0]);
  assertEqual(result.path.length, 5);
  assertEqual(result.totalCost, 4);
});

test('1.5 — 1x1 grid', () => {
  const grid = [[0]];
  const result = astar(grid, [0, 0], [0, 0]);
  assertNotNull(result);
  assertEqual(result.path.length, 1);
  assertEqual(result.totalCost, 0);
});

// ═══════════════════════════════════════
// GRUP 2: ENGEL TESTLERİ
// ═══════════════════════════════════════
console.log('\n📦 GRUP 2: Engel Testleri\n');

test('2.1 — Basit engelden kaçınma', () => {
  const grid = [
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
  ];
  const result = astar(grid, [0, 0], [0, 2]);
  assertNotNull(result, 'Engelin etrafından dolanmalı');
  assertPathValid(result.path, grid, [0, 0], [0, 2]);
});

test('2.2 — Tam kapalı hedef (yol yok)', () => {
  const grid = [
    [0, 0, 0],
    [0, 1, 1],
    [0, 1, 0],
  ];
  const result = astar(grid, [0, 0], [2, 2]);
  assertNull(result, 'Hedef çevrelenmiş, yol olmamalı');
});

test('2.3 — Başlangıç noktası engel', () => {
  const grid = [
    [1, 0],
    [0, 0],
  ];
  const result = astar(grid, [0, 0], [1, 1]);
  assertNull(result, 'Başlangıç engel olunca yol olmamalı');
});

test('2.4 — Hedef noktası engel', () => {
  const grid = [
    [0, 0],
    [0, 1],
  ];
  const result = astar(grid, [0, 0], [1, 1]);
  assertNull(result, 'Hedef engel olunca yol olmamalı');
});

test('2.5 — Labirent testi', () => {
  const grid = [
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [4, 4]);
  assertNotNull(result, 'Labirentte yol bulunmalı');
  assertPathValid(result.path, grid, [0, 0], [4, 4]);
});

test('2.6 — Tamamen kapalı harita', () => {
  const grid = [
    [0, 1],
    [1, 0],
  ];
  const result = astar(grid, [0, 0], [1, 1]);
  assertNull(result, 'Çapraz bağlantı yok, yol olmamalı');
});

// ═══════════════════════════════════════
// GRUP 3: YOKUŞ (MALİYET) TESTLERİ
// ═══════════════════════════════════════
console.log('\n📦 GRUP 3: Yokuş / Maliyet Testleri\n');

test('3.1 — Yokuştan kaçınma (uzun ama ucuz yol tercih)', () => {
  const grid = [
    [0, 2, 0],
    [0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [0, 2]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [0, 2]);
  // Alttan dolanma maliyeti: 4 — yokuştan geçme: 6
  if (result.totalCost > 4) {
    throw new Error(`Alttan dolanma totalCost 4 olmalı, geldi: ${result.totalCost}`);
  }
});

test('3.2 — Mecburi yokuş (başka yol yok)', () => {
  const grid = [
    [0, 2, 0],
    [1, 2, 1],
    [0, 2, 0],
  ];
  const result = astar(grid, [0, 0], [0, 2]);
  assertNotNull(result, 'Mecburen yokuştan geçmeli');
  assertPathValid(result.path, grid, [0, 0], [0, 2]);
  if (result.stats.slopeCount === 0) {
    throw new Error('Mecburi yokuş yolunda slopeCount > 0 olmalı');
  }
});

test('3.3 — Uzun düz yol vs kısa yokuşlu yol', () => {
  const grid = [
    [0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0],
    [0, 2, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [4, 0]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [4, 0]);
});

test('3.4 — Çoklu yokuş maliyeti birikimi', () => {
  const grid = [
    [0, 2, 2, 2, 0],
    [0, 0, 0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [0, 4]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [0, 4]);
  // Üst yol (yokuşlardan): 5+5+5+1 = 16
  // Alt yol (dolanma): 1+1+1+1+1+1 = 6
  if (result.totalCost > 6) {
    throw new Error(`Alttan dolanma totalCost 6 olmalıydı, geldi: ${result.totalCost}`);
  }
});

test('3.5 — Tek yokuş hücresi, geçmeye değer mi?', () => {
  const grid = [
    [0, 0, 0],
    [0, 2, 0],
    [0, 0, 0],
  ];
  const result = astar(grid, [1, 0], [1, 2]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [1, 0], [1, 2]);
  if (result.totalCost > 4) {
    throw new Error(`Yokuştan kaçınarak totalCost 4 olmalı, geldi: ${result.totalCost}`);
  }
  assertEqual(result.stats.slopeCount, 0, 'Yokuştan geçmemeli');
});

// ═══════════════════════════════════════
// GRUP 4: SINIR DURUMLARI (EDGE CASES)
// ═══════════════════════════════════════
console.log('\n📦 GRUP 4: Sınır Durumları (Edge Cases)\n');

test('4.1 — Grid dışı başlangıç koordinatı', () => {
  const grid = [[0, 0], [0, 0]];
  const result = astar(grid, [-1, 0], [1, 1]);
  assertNull(result, 'Negatif koordinat, null dönmeli');
});

test('4.2 — Grid dışı hedef koordinatı', () => {
  const grid = [[0, 0], [0, 0]];
  const result = astar(grid, [0, 0], [5, 5]);
  assertNull(result, 'Grid dışı hedef, null dönmeli');
});

test('4.3 — Büyük grid performansı (50x50)', () => {
  const size = 50;
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));
  const start = performance.now();
  const result = astar(grid, [0, 0], [size - 1, size - 1]);
  const elapsed = performance.now() - start;
  assertNotNull(result, '50x50 düz gridde yol bulunmalı');
  assertPathValid(result.path, grid, [0, 0], [size - 1, size - 1]);
  if (elapsed > 100) {
    throw new Error(`50x50 grid çok yavaş: ${elapsed.toFixed(1)}ms (limit: 100ms)`);
  }
});

test('4.4 — Büyük grid performansı (200x200)', () => {
  const size = 200;
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let i = 0; i < size * size * 0.2; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
    grid[r][c] = 1;
  }
  const start = performance.now();
  const result = astar(grid, [0, 0], [size - 1, size - 1]);
  const elapsed = performance.now() - start;
  if (result) {
    console.log(`     200x200 grid: ${elapsed.toFixed(1)}ms, yol: ${result.path.length} adım, maliyet: ${result.totalCost}`);
  } else {
    console.log(`     200x200 grid: ${elapsed.toFixed(1)}ms, yol: bulunamadı`);
  }
  if (elapsed > 1000) {
    throw new Error(`200x200 grid çok yavaş: ${elapsed.toFixed(1)}ms (limit: 1000ms)`);
  }
});

test('4.5 — Export doğruluğu (fonksiyon dönüyor mu?)', () => {
  if (typeof astar !== 'function') {
    throw new Error(`astar bir fonksiyon değil, typeof: ${typeof astar}`);
  }
});

// ═══════════════════════════════════════
// GRUP 5: YENİ DÖNÜŞ FORMATI TESTLERİ
// ═══════════════════════════════════════
console.log('\n📦 GRUP 5: Dönüş Formatı { path, totalCost, stats }\n');

test('5.1 — Dönüş objesi doğru yapıda mı?', () => {
  const grid = [[0, 0], [0, 0]];
  const result = astar(grid, [0, 0], [1, 1]);
  assertNotNull(result);
  if (typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(`Dönüş bir obje olmalı, gelen: ${typeof result}`);
  }
  if (!Array.isArray(result.path)) {
    throw new Error(`result.path bir array olmalı`);
  }
  if (typeof result.totalCost !== 'number') {
    throw new Error(`result.totalCost bir number olmalı, gelen: ${typeof result.totalCost}`);
  }
  if (typeof result.stats !== 'object') {
    throw new Error(`result.stats bir obje olmalı`);
  }
});

test('5.2 — stats alanları doğru mu?', () => {
  const grid = [[0, 0], [0, 0]];
  const result = astar(grid, [0, 0], [1, 1]);
  const { stats } = result;

  if (typeof stats.stepCount !== 'number') {
    throw new Error('stats.stepCount number olmalı');
  }
  if (typeof stats.slopeCount !== 'number') {
    throw new Error('stats.slopeCount number olmalı');
  }
  if (typeof stats.flatCount !== 'number') {
    throw new Error('stats.flatCount number olmalı');
  }
  // stepCount = slopeCount + flatCount olmalı
  if (stats.stepCount !== stats.slopeCount + stats.flatCount) {
    throw new Error(
      `stepCount (${stats.stepCount}) = slopeCount (${stats.slopeCount}) + flatCount (${stats.flatCount}) olmalı`
    );
  }
});

test('5.3 — totalCost düz yolda doğru hesaplanıyor mu (çapraz vs düz)?', () => {
  const grid = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [2, 2]);
  assertEqual(result.totalCost, 2.83, '2 çapraz adım yakl 2.83 maliyetlidir');
  assertEqual(result.stats.slopeCount, 0, 'Düz yolda slopeCount 0 olmalı');
});

test('5.4 — totalCost yokuşlu yolda doğru hesaplanıyor mu?', () => {
  // Mecburi yokuş yolu: tek geçiş yokuştan
  const grid = [
    [0, 2, 0],
    [1, 1, 1],
  ];
  const result = astar(grid, [0, 0], [0, 2]);
  assertNotNull(result, 'Yokuştan geçmeli');
  // Yol: [0,0] → [0,1](yokuş=5, risk=3) → [0,2](düz=1, risk=3) = toplam 12
  assertEqual(result.totalCost, 12, 'Yokuş + risk = 8, düz + risk = 4. Toplam = 12');
  assertEqual(result.stats.slopeCount, 1, 'Bir yokuş hücresi');
  assertEqual(result.stats.flatCount, 1, 'Bir düz hücre');
  assertEqual(result.stats.stepCount, 2, 'Toplam 2 adım');
});

test('5.5 — totalCost sıfır maliyet (start === end)', () => {
  const grid = [[0]];
  const result = astar(grid, [0, 0], [0, 0]);
  assertEqual(result.totalCost, 0, 'Aynı noktada maliyet 0');
  assertEqual(result.stats.stepCount, 0, 'Adım yok');
  assertEqual(result.stats.slopeCount, 0);
  assertEqual(result.stats.flatCount, 0);
});

test('5.6 — path koordinatları hâlâ [r, c] formatında mı?', () => {
  const grid = [[0, 0], [0, 0]];
  const result = astar(grid, [0, 0], [1, 1]);
  for (const coord of result.path) {
    if (!Array.isArray(coord) || coord.length !== 2) {
      throw new Error(`Koordinat [r,c] olmalı, gelen: ${JSON.stringify(coord)}`);
    }
    if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
      throw new Error(`Koordinat değerleri number olmalı`);
    }
  }
});

test('5.7 — Karmaşık yolda stats tutarlılığı', () => {
  const grid = [
    [0, 0, 2, 0],
    [0, 1, 2, 0],
    [0, 0, 0, 0],
  ];
  const result = astar(grid, [0, 0], [0, 3]);
  assertNotNull(result);
  assertPathValid(result.path, grid, [0, 0], [0, 3]);

  // Manuel doğrulama: toplam maliyeti yoldan hesapla
  let manualCost = 0;
  let manualSlope = 0;
  let manualFlat = 0;
  for (let i = 1; i < result.path.length; i++) {
    const [pr, pc] = result.path[i - 1];
    const [r, c] = result.path[i];
    const isDiagonal = Math.abs(pr - r) + Math.abs(pc - c) === 2;
    const baseCost = grid[r][c] === 2 ? 5 : 1;

    // Risk cezasını manuel hesapla
    let risk = 0;
    const rows = grid.length;
    const cols = grid[0].length;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          risk = 3;
        }
      }
    }

    manualCost += (isDiagonal ? baseCost * Math.SQRT2 : baseCost) + risk;

    if (grid[r][c] === 2) {
      manualSlope++;
    } else {
      manualFlat++;
    }
  }
  assertEqual(result.totalCost, parseFloat(manualCost.toFixed(2)), 'totalCost yol ile eşleşmeli');
  assertEqual(result.stats.slopeCount, manualSlope, 'slopeCount yol ile eşleşmeli');
  assertEqual(result.stats.flatCount, manualFlat, 'flatCount yol ile eşleşmeli');
});

// ═══════════════════════════════════════
// GRUP 6: SERVER.JS ENTEGRASYON ANALİZİ
// ═══════════════════════════════════════
console.log('\n📦 GRUP 6: server.js Entegrasyon Analizi\n');

test('6.1 — server.js A* entegrasyonu kontrolü', () => {
  const serverContent = fs.readFileSync(
    path.join(__dirname, '..', 'server.js'), 'utf-8'
  );
  const usesAstar = serverContent.includes("import astar") ||
                    serverContent.includes('import { astar }');
  if (!usesAstar) {
    throw new Error(
      'server.js henüz astar modülünü import etmiyor!\n' +
      '   findPath fonksiyonu sahte (stub) — gerçek A* ile değiştirilmeli.'
    );
  }
});

test('6.2 — Input validation kontrolü', () => {
  const serverContent = fs.readFileSync(
    path.join(__dirname, '..', 'server.js'), 'utf-8'
  );
  const hasValidation = serverContent.includes('mapGrid') &&
    (serverContent.includes('!mapGrid') || serverContent.includes('Array.isArray'));
  if (!hasValidation) {
    throw new Error(
      'server.js\'de input validation yok!\n' +
      '   mapGrid, startNode, targetNode için tip ve sınır kontrolü eklenmeli.'
    );
  }
});

// ═══════════════════════════════════════
// SONUÇLAR
// ═══════════════════════════════════════
console.log('\n═══════════════════════════════════════════════');
console.log('  TEST SONUÇLARI');
console.log('═══════════════════════════════════════════════\n');

for (const r of results) {
  console.log(`  ${r.status}  ${r.name}`);
  if (r.error) {
    for (const line of r.error.split('\n')) {
      console.log(`          ${line}`);
    }
  }
}

console.log(`\n  ─────────────────────────────────`);
console.log(`  Toplam: ${results.length} test`);
console.log(`  ✅ Başarılı: ${passed}`);
console.log(`  ❌ Başarısız: ${failed}`);
console.log(`  ─────────────────────────────────\n`);

process.exit(failed > 0 ? 1 : 0);
