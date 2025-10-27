// src/modules/progress/routes.js
import { Router } from "express";
import Progress from "./progress.model.js";
// OJO: carpeta 'middlewares' (plural) y extensión .js
import { requireAuth /*, allowRoles*/ } from "../../middleware/auth.js";

const r = Router();

/**
 * POST /api/progress
 * Crea/actualiza progreso del usuario autenticado sobre una unidad del curso
 * body: { courseId, unitId, status?, updatedAt? }
 */
r.post("/", requireAuth, async (req, res) => {
  try {
    const { courseId, unitId, status, updatedAt } = req.body;
    if (!courseId || !unitId) {
      return res.status(400).json({ message: "courseId y unitId requeridos" });
    }

    const doc = await Progress.findOneAndUpdate(
      { userId: req.user.id, courseId, unitId },
      {
        status: status || "done",
        // guarda fecha del cliente si viene
        ...(updatedAt ? { updatedAtClient: new Date(updatedAt) } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(doc);
  } catch (e) {
    console.error("POST /progress error:", e);
    return res.status(500).json({ message: "No se pudo guardar el progreso" });
  }
});

/**
 * GET /api/progress
 * Lista el progreso del usuario autenticado
 */
r.get("/", requireAuth, async (req, res) => {
  try {
    const list = await Progress.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    return res.json(list);
  } catch (e) {
    console.error("GET /progress error:", e);
    return res.status(500).json({ message: "No se pudo obtener el progreso" });
  }
});

export default r;
