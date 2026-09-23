import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// System health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NEO-TOKYO CORE v2.0',
    timestamp: new Date().toISOString()
  });
});

// Portfolio character/developer profile endpoint
app.get('/api/profile', (req, res) => {
  res.json({
    codename: 'KAGE // 影',
    role: 'Full-Stack Shinobi & Creative Architect',
    level: 'LVL 99',
    stats: {
      reactPower: '98%',
      nodeMastery: '95%',
      uiAesthetics: '99%',
      speed: 'MAX'
    },
    bio: 'Bridging the dimension between high-octane anime aesthetics and mission-critical fullstack engineering.'
  });
});

app.listen(PORT, () => {
  console.log(`[NEO-TOKYO CORE] Express Server online at http://localhost:${PORT}`);
});
