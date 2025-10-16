import jwt from 'jsonwebtoken';
export function auth(requiredRole){
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Rol insuficiente' });
      }
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}
