import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import authRoutes from './modules/auth/routes.js';
import courseRoutes from './modules/courses/routes.js';
import progressRoutes from './modules/progress/routes.js';
import syncRoutes from './modules/sync/routes.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(morgan('dev'));

const origins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json({ limit: '25mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/progress', progressRoutes);
app.use('/sync', syncRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));


const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));


app.get('*', (req, res, next) => {
  const isApi =
    req.path.startsWith('/auth') ||
    req.path.startsWith('/courses') ||
    req.path.startsWith('/progress') ||
    req.path.startsWith('/sync') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/uploads');
  if (isApi) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

const PORT = process.env.PORT || 4000;
await connectDB(process.env.MONGO_URI);
app.listen(PORT, () => console.log(`Backend escuchando en puerto ${PORT}`));
