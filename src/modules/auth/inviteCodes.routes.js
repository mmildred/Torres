import express from 'express';
import { InviteCode } from './InviteCode.model.js'; 
import { auth, requireAdmin } from '../../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();


router.use((req, res, next) => {
  console.log('🛂 [ROUTE DEBUG] Llegó a invite-codes routes:', req.method, req.url);
  console.log('🛂 [ROUTE DEBUG] Headers:', JSON.stringify(req.headers));
  return auth()(req, res, (err) => {
    if (err) {
      console.log('🛂 [ROUTE DEBUG] Error en auth:', err);
      return next(err);
    }
    console.log('🛂 [ROUTE DEBUG] Auth completado, usuario:', req.user?.email);
    next();
  });
});

router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { expiresInDays = 7 } = req.body;
    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const inviteCode = new InviteCode({
      code,
      role: 'teacher',
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    });

    await inviteCode.save();
    
    res.json({ 
      message: 'Código generado exitosamente',
      code, 
      expiresAt: inviteCode.expiresAt,
      role: 'teacher'
    });
    
  } catch (error) {
    console.error('Error generando código:', error);
    res.status(500).json({ message: 'Error generando código: ' + error.message });
  }
});


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

router.get('/', requireAdmin, async (req, res) => {
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


router.get('/stats', requireAdmin, async (req, res) => {
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
    console.log('🔄 DELETE /invite-codes/:codeId - Iniciando eliminación');
    const { codeId } = req.params;
    
    console.log('📝 ID del código a eliminar:', codeId);

    // Verificar que el código existe
    const inviteCode = await InviteCode.findById(codeId);
    
    if (!inviteCode) {
      console.log('❌ Código no encontrado:', codeId);
      return res.status(404).json({ message: 'Código de invitación no encontrado' });
    }

    console.log('📋 Código encontrado:', {
      id: inviteCode._id,
      code: inviteCode.code,
      used: inviteCode.used
    });

    // Solo permitir eliminar códigos no utilizados
    if (inviteCode.used) {
      console.log('❌ Código ya utilizado, no se puede eliminar');
      return res.status(400).json({ 
        message: 'No se puede eliminar un código que ya ha sido utilizado' 
      });
    }

    // Eliminar el código
    await InviteCode.findByIdAndDelete(codeId);
    
    console.log('✅ Código eliminado exitosamente');

    res.json({ 
      message: 'Código de invitación eliminado correctamente',
      deletedCode: {
        id: inviteCode._id,
        code: inviteCode.code
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando código de invitación:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});



export default router;