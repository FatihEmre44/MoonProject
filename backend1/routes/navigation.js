import express from 'express';
import astar, { astarMulti } from '../utils/astar.js';
import { calculateTelemetry } from '../utils/telemetry.js';
import { generateMissionReport } from '../services/llmService.js';

const router = express.Router();

// API Endpoint: Tek Hedef Rota Planlama
router.post('/plan-route', async (req, res) => {
    try {
        const { mapGrid, startNode, targetNode, craterMap = {} } = req.body;

        // ── Input Validation ──────────────────────────────
        if (!mapGrid || !startNode || !targetNode) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid, startNode ve targetNode alanları zorunludur.',
            });
        }

        if (!Array.isArray(mapGrid) || !Array.isArray(startNode) || !Array.isArray(targetNode)) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid, startNode ve targetNode array olmalıdır.',
            });
        }

        if (startNode.length !== 2 || targetNode.length !== 2) {
            return res.status(400).json({
                success: false,
                error: 'startNode ve targetNode [satır, sütun] formatında olmalıdır.',
            });
        }

        if (mapGrid.length === 0 || !Array.isArray(mapGrid[0])) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid geçerli bir 2D grid olmalıdır.',
            });
        }

        // ── A* Algoritmasını Çalıştır ─────────────────────
        const result = astar(mapGrid, craterMap, startNode, targetNode);

        // ── Yol Bulunamadı ────────────────────────────────
        if (!result) {
            const telemetry = calculateTelemetry(null, mapGrid);
            return res.json({
                success: false,
                path: null,
                totalCost: 0,
                stats: null,
                telemetry,
                aiReport: 'Hedefe ulaşılabilecek bir rota bulunamadı.',
            });
        }

        // ── Telemetri Hesapla & Yanıt Gönder ──────────────
        const telemetry = calculateTelemetry(result, mapGrid);

        // ── Gemini AI Analiz Raporu ──────────────
        const aiReport = await generateMissionReport({
            batteryUsage: telemetry.batteryUsage,
            riskScore: telemetry.riskScore,
            stepCount: result.stats.stepCount,
            slopeCount: result.stats.slopeCount,
            craterMap
        });

        res.json({
            success: true,
            path: result.path,
            totalCost: result.totalCost,
            stats: result.stats,
            telemetry,
            aiReport,
        });

    } catch (error) {
        console.error('Plan-route hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu.',
        });
    }
});

// API Endpoint: Çoklu Hedef Rota Planlama
router.post('/plan-multi-route', async (req, res) => {
    try {
        const { mapGrid, waypoints, craterMap = {} } = req.body;

        // ── Input Validation ──────────────────────────────
        if (!mapGrid || !waypoints) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid ve waypoints alanları zorunludur.',
            });
        }

        if (!Array.isArray(mapGrid) || !Array.isArray(waypoints)) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid ve waypoints array olmalıdır.',
            });
        }

        if (waypoints.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'waypoints en az 2 nokta içermelidir (başlangıç + hedef).',
            });
        }

        if (mapGrid.length === 0 || !Array.isArray(mapGrid[0])) {
            return res.status(400).json({
                success: false,
                error: 'mapGrid geçerli bir 2D grid olmalıdır.',
            });
        }

        // ── Çoklu A* Çalıştır ─────────────────────────────
        const result = astarMulti(mapGrid, craterMap, waypoints);

        if (!result || !result.path) {
            const telemetry = calculateTelemetry(null, mapGrid);
            return res.json({
                success: false,
                path: null,
                totalCost: 0,
                stats: null,
                legs: result?.legs || [],
                failedLeg: result?.failedLeg || null,
                telemetry,
                aiReport: result?.failedLeg?.reason || 'Rota hesaplanamadı.',
            });
        }

        const telemetry = calculateTelemetry(result, mapGrid);

        // ── Gemini AI Analiz Raporu ──────────────
        const aiReport = await generateMissionReport({
            batteryUsage: telemetry.batteryUsage,
            riskScore: telemetry.riskScore,
            stepCount: result.stats.stepCount,
            slopeCount: result.stats.slopeCount,
            legCount: result.stats.legCount,
            craterMap
        });

        res.json({
            success: true,
            path: result.path,
            totalCost: result.totalCost,
            stats: result.stats,
            legs: result.legs,
            telemetry,
            aiReport,
        });

    } catch (error) {
        console.error('Plan-multi-route hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu.',
        });
    }
});

export default router;
