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
import adminRoutes from './modules/auth/admin.routes.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use((req, res, next) => {

  res.setHeader('Service-Worker-Allowed', '/none');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(morgan('dev'));

const origins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true
}));

// ✅ AGREGAR ESTO: Headers específicos para archivos estáticos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json({ limit: '25mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/progress', progressRoutes);
app.use('/sync', syncRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// ✅ CORREGIDO: frontend en lugar de client
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Manejar SPA routing
app.get('*', (req, res, next) => {
  const isApi =
    req.path.startsWith('/auth') ||
    req.path.startsWith('/courses') ||
    req.path.startsWith('/progress') ||
    req.path.startsWith('/sync') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/admin') ||
    req.path.startsWith('/uploads');
  if (isApi) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

const PORT = process.env.PORT || 4000;
await connectDB(process.env.MONGO_URI);
app.listen(PORT, () => console.log(`Backend escuchando en puerto ${PORT}`));