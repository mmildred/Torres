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
      
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ 
          message: `Acceso denegado. Se requiere rol: ${requiredRole}` 
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
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