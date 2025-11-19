import express from 'express';
import { InviteCode } from './InviteCode.model.js'; 
import { auth } from '../../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use((req, res, next) => {
  return auth()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    console.log('🛂 [ROUTE DEBUG] Auth completado, usuario:', req.user?.email);
    next();
  });
});

// ✅ CORREGIR: Usar el role del body en lugar de 'teacher' fijo
router.post('/generate', async (req, res) => {
  try {
    const { expiresInDays = 7, role = 'teacher' } = req.body;
    
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden generar códigos de administrador' 
      });
    }

    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const inviteCode = new InviteCode({
      code,
      role: role, // ✅ CAMBIAR: usar la variable role, no 'teacher' fijo
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    });

    await inviteCode.save();
    
    res.json({ 
      message: 'Código generado exitosamente',
      code, 
      expiresAt: inviteCode.expiresAt,
      role: role // ✅ CAMBIAR: usar la variable role
    });
    
  } catch (error) {
    console.error('Error generando código:', error);
    res.status(500).json({ message: 'Error generando código: ' + error.message });
  }
});

router.post('/generate-admin', async (req, res) => {
  try {
    const { expiresInDays = 7 } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'No tienes permisos para generar códigos de administrador' 
      });
    }

    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const inviteCode = new InviteCode({
      code,
      role: 'admin',
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    });

    await inviteCode.save();
    
    res.json({ 
      message: 'Código de administrador generado exitosamente',
      code, 
      expiresAt: inviteCode.expiresAt,
      role: 'admin'
    });
    
  } catch (error) {
    console.error('Error generando código de admin:', error);
    res.status(500).json({ message: 'Error generando código de admin: ' + error.message });
  }
});

// ... el resto del código se mantiene igual
router.get('/verify/:code', async (req, res) => {
  try {
    const inviteCode = await InviteCode.findOne({ 
      code: req.params.code.toUpperCase() 
    });
    
    if (!inviteCode) {
      return res.status(404).json({ 
        valid: false,
        message: 'Código inválido' 
      });
    }
    
    if (inviteCode.used) {
      return res.status(400).json({ 
        valid: false,
        message: 'Código ya utilizado' 
      });
    }
    
    if (new Date() > inviteCode.expiresAt) {
      return res.status(400).json({ 
        valid: false,
        message: 'Código expirado' 
      });
    }
    
    res.json({ 
      valid: true, 
      role: inviteCode.role,
      expiresAt: inviteCode.expiresAt,
      message: 'Código válido'
    });
  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Error verificando código' 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const codes = await InviteCode.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(codes);
  } catch (error) {
    console.error('Error obteniendo códigos:', error);
    res.status(500).json({ message: 'Error obteniendo códigos' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalCodes = await InviteCode.countDocuments();
    const usedCodes = await InviteCode.countDocuments({ used: true });
    const activeCodes = await InviteCode.countDocuments({ 
      used: false, 
      expiresAt: { $gt: new Date() } 
    });
    const expiredCodes = await InviteCode.countDocuments({ 
      used: false, 
      expiresAt: { $lte: new Date() } 
    });
    
    res.json({
      total: totalCodes,
      used: usedCodes,
      active: activeCodes,
      expired: expiredCodes
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

router.delete('/:codeId', auth(), async (req, res) => {
  try {
    const { codeId } = req.params;
    
    const inviteCode = await InviteCode.findById(codeId);
    
    if (!inviteCode) {
      return res.status(404).json({ message: 'Código de invitación no encontrado' });
    }

    if (inviteCode.used) {
      return res.status(400).json({ 
        message: 'No se puede eliminar un código que ya ha sido utilizado' 
      });
    }

    await InviteCode.findByIdAndDelete(codeId);

    res.json({ 
      message: 'Código de invitación eliminado correctamente',
      deletedCode: inviteCode
    });

  } catch (error) {
    console.error('Error eliminando código de invitación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;