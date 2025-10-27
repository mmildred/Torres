import { Router } from "express";
import multer from "multer";
import path from "path";
import Course from "../courses/course.model.js";
import Content from "../courses/content.model.js";
import Enrollment from "../courses/enrollment.model.js";
import { requireAuth, allowRoles } from "../../middleware/auth.js";

const router = Router();

/* --- subida de archivos (contenido) --- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ct-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

/* --- CURSOS --- */
// Crear curso (admin o profesor). Owner = usuario autenticado
router.post("/", requireAuth, allowRoles("admin", "profesor"), async (req, res) => {
  try {
    const { title, description, category, level, thumbnail } = req.body;
    const owner = { _id: req.user.id, name: req.user.name, role: req.user.role === "admin" ? "admin" : "profesor" };
    const course = await Course.create({ title, description, category, level, thumbnail, owner });
    res.status(201).json(course);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo crear el curso" });
  }
});

// Listar cursos
router.get("/", requireAuth, async (_req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json(courses);
});

// Detalle de curso + contenidos
router.get("/:courseId", requireAuth, async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
  const contents = await Content.find({ courseId }).sort({ order: 1, createdAt: 1 });
  res.json({ course, contents });
});

/* --- CONTENIDOS --- */
// Agregar contenido (text/link) por el owner o admin
router.post(
  "/:courseId/contents",
  requireAuth,
  allowRoles("admin", "profesor"),
  async (req, res) => {
    const { courseId } = req.params;
    const { title, type, text, url, order = 0, durationMinutes = 0 } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    // Solo el dueño o admin pueden subir contenido
    if (req.user.role !== "admin" && String(course.owner._id) !== req.user.id)
      return res.status(403).json({ error: "Solo el dueño del curso puede agregar contenido" });

    if (!["text", "link"].includes(type)) return res.status(400).json({ error: "type inválido" });

    const content = await Content.create({
      courseId,
      title,
      type,
      text: type === "text" ? text || "" : "",
      url: type === "link" ? url || "" : "",
      order,
      durationMinutes,
    });

    res.status(201).json(content);
  }
);

// Subir contenido de archivo (PDF/video/img)
router.post(
  "/:courseId/contents/file",
  requireAuth,
  allowRoles("admin", "profesor"),
  upload.single("file"),
  async (req, res) => {
    const { courseId } = req.params;
    const { title, order = 0, durationMinutes = 0 } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    if (req.user.role !== "admin" && String(course.owner._id) !== req.user.id)
      return res.status(403).json({ error: "Solo el dueño del curso puede agregar contenido" });

    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    const filePath = `/uploads/${req.file.filename}`;
    const content = await Content.create({
      courseId,
      title,
      type: "file",
      filePath,
      order,
      durationMinutes,
    });

    res.status(201).json(content);
  }
);

/* --- INSCRIPCIONES Y PROGRESO --- */
// Inscribirse a un curso (alumno)
router.post("/:courseId/enroll", requireAuth, allowRoles("alumno", "admin", "profesor"), async (req, res) => {
  const { courseId } = req.params;
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { courseId, studentId: req.user.id },
      { $setOnInsert: { courseId, studentId: req.user.id }, $set: { lastAccessAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json(enrollment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo inscribir" });
  }
});

// Marcar contenido como completado (alumno)
router.post("/:courseId/progress/complete", requireAuth, allowRoles("alumno"), async (req, res) => {
  const { courseId } = req.params;
  const { contentId } = req.body;

  const content = await Content.findOne({ _id: contentId, courseId });
  if (!content) return res.status(404).json({ error: "Contenido no encontrado" });

  const enrollment = await Enrollment.findOneAndUpdate(
    { courseId, studentId: req.user.id },
    { $addToSet: { completedContentIds: content._id }, $set: { lastAccessAt: new Date() } },
    { upsert: true, new: true }
  );

  res.json(enrollment);
});

// Progreso del alumno actual (percent)
router.get("/:courseId/progress/me", requireAuth, async (req, res) => {
  const { courseId } = req.params;
  const [total, enr] = await Promise.all([
    Content.countDocuments({ courseId }),
    Enrollment.findOne({ courseId, studentId: req.user.id }),
  ]);
  const completed = enr?.completedContentIds?.length || 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  res.json({ total, completed, percent });
});

// Estadísticas para el dueño del curso (o admin)
router.get("/:courseId/stats", requireAuth, allowRoles("admin", "profesor"), async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
  if (req.user.role !== "admin" && String(course.owner._id) !== req.user.id)
    return res.status(403).json({ error: "Solo el dueño del curso puede ver estadísticas" });

  const totalContents = await Content.countDocuments({ courseId });

  const enrollments = await Enrollment.find({ courseId })
    .populate("studentId", "name email")
    .lean();

  const rows = enrollments.map((e) => {
    const completed = e.completedContentIds?.length || 0;
    const percent = totalContents > 0 ? Math.round((completed / totalContents) * 100) : 0;
    return {
      studentId: e.studentId?._id,
      name: e.studentId?.name || "Alumno",
      email: e.studentId?.email || "",
      completed,
      total: totalContents,
      percent,
      lastAccessAt: e.lastAccessAt,
    };
  });

  const summary = {
    students: rows.length,
    avgPercent: rows.length ? Math.round(rows.reduce((a, b) => a + b.percent, 0) / rows.length) : 0,
    completedAll: rows.filter((r) => r.percent === 100).length,
  };

  res.json({ summary, rows });
});

export default router;
