import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import navigationRoutes from './routes/navigation.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rotaları kullan
app.use('/api', navigationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend 🚀 http://localhost:${PORT} adresinde hazır!`);
});