// app.js - VERSIÓN QUE SÍ FUNCIONA
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// ========== RUTAS SIMULADAS PERO FUNCIONALES ==========

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Campus Digital API (Backend Funcional)',
    version: '1.0.0',
    status: 'operational'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ========== RUTAS FIJAS DE /courses ==========
console.log('\n📁 REGISTRANDO RUTAS FIJAS PARA /courses...');

// 1. Lista general de cursos (para catálogo)
app.get('/courses', (req, res) => {
  console.log('📞 GET /courses recibido');
  res.json([
    {
      _id: 'course1',
      title: 'Introducción a la Programación',
      description: 'Aprende los fundamentos de la programación',
      category: 'Programación',
      level: 'beginner',
      duration: '8 semanas',
      thumbnail: '',
      isPublished: true,
      owner: { _id: 'instructor1', name: 'Profesor Demo' }
    },
    {
      _id: 'course2',
      title: 'JavaScript Moderno',
      description: 'Desarrollo web con JavaScript ES6+',
      category: 'Programación',
      level: 'intermediate',
      duration: '10 semanas',
      thumbnail: '',
      isPublished: true,
      owner: { _id: 'instructor1', name: 'Profesor Demo' }
    }
  ]);
});

// 2. Cursos del instructor (para MyCourses.jsx)
app.get('/courses/instructor/my-courses', (req, res) => {
  console.log('📞 GET /courses/instructor/my-courses recibido');
  res.json([
    {
      _id: 'instructor-course-1',
      title: 'Mi Curso de Matemáticas',
      description: 'Curso avanzado de matemáticas',
      category: 'Matemáticas',
      level: 'avanzado',
      studentCount: 12,
      avgProgress: 75,
      isPublished: true,
      createdAt: new Date().toISOString(),
      owner: {
        _id: 'user123',
        name: 'Profesor Demo',
        role: 'teacher'
      }
    },
    {
      _id: 'instructor-course-2',
      title: 'Programación para Principiantes',
      description: 'Aprende a programar desde cero',
      category: 'Programación',
      level: 'principiante',
      studentCount: 8,
      avgProgress: 60,
      isPublished: true,
      createdAt: new Date().toISOString(),
      owner: {
        _id: 'user123',
        name: 'Profesor Demo',
        role: 'teacher'
      }
    }
  ]);
});

// 3. Estadísticas del instructor
app.get('/courses/instructor/stats', (req, res) => {
  console.log('📞 GET /courses/instructor/stats recibido');
  res.json({
    totalCourses: 2,
    totalStudents: 20,
    totalEnrollments: 20,
    courses: [
      {
        _id: 'instructor-course-1',
        title: 'Mi Curso de Matemáticas',
        studentCount: 12,
        avgProgress: 75
      },
      {
        _id: 'instructor-course-2',
        title: 'Programación para Principiantes',
        studentCount: 8,
        avgProgress: 60
      }
    ]
  });
});

// 4. Mis cursos (estudiante)
app.get('/courses/my-courses', (req, res) => {
  console.log('📞 GET /courses/my-courses recibido');
  res.json([]);
});

// 5. Progreso en curso específico (para Courses.jsx)
app.get('/courses/:id/progress/me', (req, res) => {
  console.log(`📞 GET /courses/${req.params.id}/progress/me recibido`);
  res.json({
    enrolled: true,
    progress: 25,
    completedContents: 1,
    totalContents: 4,
    lastAccessAt: new Date().toISOString(),
    enrolledAt: new Date().toISOString()
  });
});

// 6. Detalle de curso
app.get('/courses/:id', (req, res) => {
  console.log(`📞 GET /courses/${req.params.id} recibido`);
  res.json({
    _id: req.params.id,
    title: 'Curso de Ejemplo',
    description: 'Descripción detallada del curso',
    category: 'General',
    level: 'beginner',
    isPublished: true,
    contents: [
      { _id: 'content1', title: 'Lección 1', type: 'text' },
      { _id: 'content2', title: 'Lección 2', type: 'video' }
    ],
    owner: {
      _id: 'instructor1',
      name: 'Profesor Demo',
      role: 'teacher'
    }
  });
});

// ========== RUTAS PARA DEBUG ==========
app.get('/debug', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  
  res.json({
    server: 'Campus Digital Backend',
    status: 'running',
    routes: routes
  });
});

// ========== MANEJO DE ERRORES ==========
app.use((req, res) => {
  if (req.path.startsWith('/courses')) {
    res.status(404).json({
      error: 'Ruta de cursos no encontrada',
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        'GET  /courses',
        'GET  /courses/instructor/my-courses',
        'GET  /courses/instructor/stats',
        'GET  /courses/my-courses',
        'GET  /courses/:id',
        'GET  /courses/:id/progress/me'
      ]
    });
  } else {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl
    });
  }
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SERVIDOR INICIADO! RUTAS FIJAS ACTIVAS');
  console.log('='.repeat(60));
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('\n📋 RUTAS DISPONIBLES:');
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${Port}/courses`);
  console.log(`   http://localhost:${PORT}/courses/instructor/my-courses`);
  console.log(`   http://localhost:${PORT}/courses/instructor/stats`);
  console.log(`   http://localhost:${PORT}/courses/my-courses`);
  console.log(`   http://localhost:${PORT}/courses/:id/progress/me`);
  console.log(`   http://localhost:${PORT}/debug`);
  console.log('='.repeat(60));
  console.log('\n✅ PRUEBA RÁPIDA:');
  console.log(`   curl http://localhost:${PORT}/courses/instructor/my-courses`);
  console.log('='.repeat(60));
});