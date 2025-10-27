// src/middlewares/auth.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export const requireAuth = (req, res, next) => {
  const h = req.header("Authorization");
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "No autenticado" });
  try {
    const token = h.slice(7);
    const p = jwt.verify(token, JWT_SECRET);
    req.user = { id: p.id, name: p.name, role: p.role };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "No autenticado" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Permisos insuficientes" });
  next();
};

// 🔽 Alias para compatibilidad con código antiguo:
export const auth = (...args) => requireAuth(...args);
