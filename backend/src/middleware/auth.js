import jwt from 'jsonwebtoken';
import User from '../modules/auth/user.model.js';

export function auth(requiredRole) {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token requerido' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        return res.status(403).json({ 
          message: `Acceso denegado. Se requiere rol: ${requiredRole}` 
        });
      }
      
      // ✅ CORRECCIÓN: Normalizar el objeto de usuario
      req.user = {
        _id: user._id,
        id: user._id.toString(), // ✅ Agregar propiedad 'id'
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      console.log('Usuario autenticado:', {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      });
      
      next();
    } catch (error) {
      console.error('Error en middleware auth:', error);
      res.status(401).json({ message: 'Token inválido' });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Se requieren permisos de administrador' });
  }
  next();
}