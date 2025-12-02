import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    message: ' Campus Digital API',
    version: '1.0.0',
    status: 'operational'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Campus Digital Backend'
  });
});

app.post('/test-email', async (req, res) => {
  try {
    console.log(' Probando servicio de email...');
    
    const { email, name } = req.body;
    const userEmail = email || process.env.EMAIL_USER || 'gerardo8.manzano@gmail.com';
    const userName = name || 'Usuario Test';
    
    console.log(`   Destino: ${userEmail}`);
    
    // NOTA: La ruta CORRECTA es ./src/utils/emailService.js
    const emailService = await import('./src/utils/emailService.js');
    
    await emailService.sendWelcomeEmail(userEmail, userName);
    
    res.json({
      success: true,
      message: ` Email enviado a ${userEmail}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(' Error en test-email:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Verifica EMAIL_USER y EMAIL_PASSWORD en .env'
    });
  }
});

// ========== CARGAR RUTAS DE MÓDULOS ==========
async function loadRoutes() {
  const modules = [
    { path: './modules/auth/routes.js', prefix: '/auth' },
    { path: './modules/courses/routes.js', prefix: '/courses' },
    { path: './modules/progress/routes.js', prefix: '/progress' },
    { path: './modules/sync/routes.js', prefix: '/sync' }
  ];
  
  for (const module of modules) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(module.path.replace('./', ''))) {
        const routeModule = await import(module.path);
        app.use(module.prefix, routeModule.default || routeModule);
      }
    } catch (error) {
    }
  }
}

app.use((err, req, res, next) => {
  console.error(' Error:', err.message);
  res.status(500).json({
    error: 'Error interno',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'No encontrado',
    path: req.originalUrl
  });
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    console.log('\n Conectando a MongoDB...');
    
    // Importar db.js (está en la raíz de backend)
    const { connectDB } = await import('./db.js');
    await connectDB(process.env.MONGO_URI);
    
    try {
      const emailService = await import('./src/utils/emailService.js');
      await emailService.verifyEmailConnection();
    } catch (emailError) {
    }
    
    await loadRoutes();
    
    app.listen(PORT, () => {
    });
    
  } catch (error) {
    console.error('\n ERROR:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n El error indica que falta un archivo.');
      console.log('   Archivos necesarios:');
      console.log('    db.js - Existe en la raíz');
      console.log('    src/utils/emailService.js - Existe');
      console.log('   Verifica otras importaciones en tu código.');
    }
    
    process.exit(1);
  }
}

startServer();
