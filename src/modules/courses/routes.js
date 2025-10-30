// modules/courses/routes.js - VERSIÓN CORREGIDA
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Course from './course.model.js';
import Enrollment from './enrollment.model.js';
import { auth } from '../../middleware/auth.js';
import User from '../auth/user.model.js';

const r = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

r.get('/', async (req, res) => {
  try {
    let filter = {};
    
    // 🔴 PROBLEMA: El filtro actual no funciona correctamente
    // ✅ SOLUCIÓN: Construir el filtro paso a paso
    
    if (req.user) {
      // Si es teacher o admin, puede ver:
      // 1. Todos los cursos publicados
      // 2. Sus propios cursos (publicados o no)
      if (req.user.role === 'teacher' || req.user.role === 'admin') {
        filter = {
          $or: [
            { isPublished: true }, // Cursos publicados (todos pueden ver)
            { 
              $or: [
                { 'owner._id': req.user.id }, // Sus cursos como owner
                { 'instructors._id': req.user.id } // Sus cursos como instructor
              ]
            }
          ]
        };
      } else {
        // Para estudiantes, solo cursos publicados
        filter = { isPublished: true };
      }
    } else {
      // Usuario no autenticado, solo cursos publicados
      filter = { isPublished: true };
    }

    console.log("🔍 Filtro aplicado para usuario:", req.user?.id);
    console.log("📋 Filtro:", JSON.stringify(filter));
    
    const list = await Course.find(filter).sort({ createdAt: -1 });
    console.log("📊 Cursos encontrados:", list.length);
    
    // Log para depuración
    list.forEach(course => {
      console.log(`📖 Curso: "${course.title}" - Publicado: ${course.isPublished} - Owner: ${course.owner?._id}`);
    });

    res.json(list.map(x => x.toJSON()));
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ RUTA PARA OBTENER CURSO INDIVIDUAL
r.get('/:id', auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar si el usuario puede ver el curso
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    const isAdmin = req.user.role === 'admin';
    
    // Si el curso no está publicado y el usuario no es instructor/admin/propietario, denegar acceso
    if (!course.isPublished && !isOwner && !isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'No tienes acceso a este curso' });
    }

    res.json(course.toJSON());
  } catch (error) {
    console.error('Error obteniendo curso:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

r.post('/', auth('teacher'), async (req, res) => {
  try {
    console.log("📥 RECIBIENDO PETICIÓN PARA CREAR CURSO");
    console.log("📋 Datos recibidos:", req.body);
    console.log("👤 Usuario autenticado:", req.user);

    const { 
      title, 
      description, 
      category, 
      level, 
      duration, 
      thumbnail 
    } = req.body;
    
    if (!title || !title.trim()) {
      console.log("❌ Error: Título requerido");
      return res.status(400).json({ message: 'Título requerido' });
    }

    const creator = await User.findById(req.user.id);
    if (!creator) {
      console.log("❌ Error: Usuario no encontrado");
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log("✅ Usuario creador encontrado:", creator.name);

    const courseData = {
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "General",
      level: level || "beginner",
      duration: duration || "Auto-guiado",
      thumbnail: thumbnail || "",
      owner: {
        _id: creator._id,
        name: creator.name,
        role: creator.role
      },
      instructors: [{
        _id: creator._id,
        name: creator.name,
        role: creator.role
      }],
      contents: [],
      isPublished: true, // ✅ CAMBIAR A TRUE PARA PUBLICAR AUTOMÁTICAMENTE
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("💾 Guardando curso en base de datos...");
    const course = await Course.create(courseData);
    console.log("🎉 Curso guardado exitosamente:", course._id);
    
    res.status(201).json(course.toJSON());
    
  } catch (error) {
    console.error("❌ ERROR CRÍTICO creando curso:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log("❌ Errores de validación:", errors);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
});

// ✅ RUTA PARA SUBIR ARCHIVOS
r.post('/:courseId/upload', auth('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructions, duration } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para subir archivos' });
    }

    // Determinar el tipo de contenido basado en la extensión del archivo
    const getFileType = (filename) => {
      const ext = path.extname(filename).toLowerCase();
      if (['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'].includes(ext)) {
        return 'document';
      } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv'].includes(ext)) {
        return 'video';
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
        return 'image';
      }
      return 'document';
    };

    const fileType = getFileType(file.originalname);

    const newContent = {
      title: title || file.originalname,
      type: fileType,
      description: description || '',
      instructions: instructions || '',
      duration: duration || 0,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      filePath: file.filename,
      order: course.contents.length,
      isPublished: false,
      createdAt: new Date()
    };

    course.contents.push(newContent);
    await course.save();

    const updatedCourse = await Course.findById(courseId);
    res.status(201).json({
      message: 'Archivo subido exitosamente',
      content: newContent,
      course: updatedCourse.toJSON()
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



// ✅ RUTA PARA SERVIR ARCHIVOS SUBIDOS
r.get('/uploads/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error sirviendo archivo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ RUTA DE INSCRIPCIÓN CORREGIDA
r.post('/:courseId/enroll', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // ✅ VERIFICAR QUE EL CURSO ESTÉ PUBLICADO PARA INSCRIPCIÓN
    if (!course.isPublished) {
      return res.status(403).json({ message: 'No puedes inscribirte en un curso no publicado' });
    }

    const existingEnrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Ya estás inscrito en este curso' });
    }

    const enrollment = await Enrollment.create({
      courseId: courseId,
      userId: userId,
      completedContentIds: [],
      lastAccessAt: new Date()
    });

    res.status(200).json({
      message: 'Inscripción exitosa',
      enrollment: {
        id: enrollment._id,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.createdAt,
        lastAccessAt: enrollment.lastAccessAt
      }
    });

  } catch (error) {
    console.error('Error en inscripción:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya estás inscrito en este curso' });
    }
    
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ RUTA PARA VERIFICAR INSCRIPCIÓN (NUEVA)
r.get('/:courseId/enrollment/check', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    res.json({ 
      isEnrolled: !!enrollment,
      enrollment: enrollment || null
    });
  } catch (error) {
    console.error('Error verificando inscripción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ PUBLICAR CURSO
r.patch('/:courseId/publish', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para publicar este curso' });
    }

    course.isPublished = true;
    await course.save();

    res.json(course.toJSON());

  } catch (error) {
    console.error('Error publicando curso:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ DESPUBLICAR CURSO
r.patch('/:courseId/unpublish', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para despublicar este curso' });
    }

    course.isPublished = false;
    await course.save();

    res.json(course.toJSON());

  } catch (error) {
    console.error('Error despublicando curso:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ RUTA DE PROGRESO CORREGIDA

r.get('/:courseId/progress/me', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    // ✅ MEJORAR: DEVOLVER 200 CON enrolled: false EN LUGAR DE 404
    if (!enrollment) {
      return res.status(200).json({
        enrolled: false,
        progress: 0,
        completedContents: 0,
        totalContents: course.contents?.length || 0,
        message: 'No estás inscrito en este curso'
      });
    }

    const totalContents = course?.contents?.length || 0;
    const completedContents = enrollment.completedContentIds?.length || 0;
    const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    res.status(200).json({
      enrolled: true,
      progress: progress,
      completedContents: completedContents,
      totalContents: totalContents,
      lastAccessAt: enrollment.lastAccessAt,
      enrolledAt: enrollment.createdAt
    });

  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ RUTA PARA MANIFEST
r.get('/:id/manifest', async (req, res) => {
  try {
    const c = await Course.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    
    res.json({ 
      files: c.contents
        .filter(content => content.filePath)
        .map(x => ({ 
          name: x.fileName || x.title, 
          path: x.filePath, 
          size: x.fileSize ?? null 
        })) 
    });
  } catch (error) {
    console.error('Error en manifest:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ CREAR CONTENIDO SIN ARCHIVO
r.post('/:courseId/contents', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, type, description, instructions, duration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para agregar contenido' });
    }

    const newContent = {
      title,
      type: type || 'text',
      description: description || '',
      instructions: instructions || '',
      duration: duration || 0,
      order: course.contents.length,
      isPublished: false,
      createdAt: new Date()
    };

    course.contents.push(newContent);
    await course.save();

    const updatedCourse = await Course.findById(courseId);
    res.status(201).json(updatedCourse.toJSON());

  } catch (error) {
    console.error('Error creando contenido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ ACTUALIZAR CONTENIDO
r.put('/:courseId/contents/:contentId', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const updateData = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para editar contenido' });
    }

    // Encontrar y actualizar el contenido
    const contentIndex = course.contents.findIndex(content => 
      content._id.toString() === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Contenido no encontrado' });
    }

    // Mapear type si viene en la actualización
    if (updateData.type) {
      const mapContentType = (type) => {
        const typeMap = {
          'video': 'video',
          'document': 'documento',
          'quiz': 'quiz',
          'assignment': 'tarea',
          'text': 'texto'
        };
        return typeMap[type] || 'documento';
      };
      updateData.type = mapContentType(updateData.type);
    }

    // Actualizar el contenido
    course.contents[contentIndex] = {
      ...course.contents[contentIndex].toObject(),
      ...updateData
    };

    await course.save();
    
    const updatedCourse = await Course.findById(courseId);
    res.json(updatedCourse.toJSON());

  } catch (error) {
    console.error('Error actualizando contenido:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ ELIMINAR CONTENIDO
r.delete('/:courseId/contents/:contentId', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar contenido' });
    }

    // Filtrar el contenido a eliminar
    course.contents = course.contents.filter(content => 
      content._id.toString() !== contentId
    );

    await course.save();
    
    const updatedCourse = await Course.findById(courseId);
    res.json(updatedCourse.toJSON());

  } catch (error) {
    console.error('Error eliminando contenido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ ALTERNAR PUBLICACIÓN DE CONTENIDO
r.patch('/:courseId/contents/:contentId/toggle-publish', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar permisos
    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para publicar contenido' });
    }

    // Encontrar el contenido
    const contentIndex = course.contents.findIndex(content => 
      content._id.toString() === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Contenido no encontrado' });
    }

    // Alternar el estado de publicación
    course.contents[contentIndex].isPublished = !course.contents[contentIndex].isPublished;

    await course.save();
    
    const updatedCourse = await Course.findById(courseId);
    res.json(updatedCourse.toJSON());

  } catch (error) {
    console.error('Error alternando publicación:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

r.post('/:courseId/contents/:contentId/complete', auth(), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'No estás inscrito en este curso' });
    }

    // Verificar si ya está completado
    if (!enrollment.completedContentIds.includes(contentId)) {
      enrollment.completedContentIds.push(contentId);
      await enrollment.save();
    }

    // Calcular progreso actualizado
    const course = await Course.findById(courseId);
    const totalContents = course?.contents?.length || 0;
    const completedContents = enrollment.completedContentIds.length;
    const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    res.json({
      message: 'Contenido marcado como completado',
      completed: true,
      progress: progress,
      completedContents: completedContents,
      totalContents: totalContents
    });

  } catch (error) {
    console.error('Error completando contenido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ DESMARCAR CONTENIDO COMO COMPLETADO
r.post('/:courseId/contents/:contentId/uncomplete', auth(), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'No estás inscrito en este curso' });
    }

    // Remover de completados
    enrollment.completedContentIds = enrollment.completedContentIds.filter(
      id => id.toString() !== contentId
    );
    await enrollment.save();

    // Calcular progreso actualizado
    const course = await Course.findById(courseId);
    const totalContents = course?.contents?.length || 0;
    const completedContents = enrollment.completedContentIds.length;
    const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    res.json({
      message: 'Contenido desmarcado como completado',
      completed: false,
      progress: progress,
      completedContents: completedContents,
      totalContents: totalContents
    });

  } catch (error) {
    console.error('Error descompletando contenido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ SUBIR ENTREGA DE TAREA
r.post('/:courseId/contents/:contentId/submit', auth(), upload.single('file'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;
    const { comments } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Archivo requerido para entrega' });
    }

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'No estás inscrito en este curso' });
    }

    // Verificar si ya existe una entrega para este contenido
    const existingSubmissionIndex = enrollment.submissions.findIndex(
      submission => submission.contentId.toString() === contentId
    );

    const submissionData = {
      contentId: contentId,
      submittedAt: new Date(),
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      filePath: file.filename,
      comments: comments || '',
      status: 'submitted'
    };

    if (existingSubmissionIndex !== -1) {
      // Actualizar entrega existente
      enrollment.submissions[existingSubmissionIndex] = submissionData;
    } else {
      // Crear nueva entrega
      enrollment.submissions.push(submissionData);
    }

    await enrollment.save();

    res.status(201).json({
      message: 'Entrega enviada exitosamente',
      submission: submissionData
    });

  } catch (error) {
    console.error('Error enviando entrega:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ✅ OBTENER ENTREGAS DE UN ESTUDIANTE
r.get('/:courseId/submissions/me', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId: courseId,
      userId: userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'No estás inscrito en este curso' });
    }

    res.json({
      submissions: enrollment.submissions || []
    });

  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

r.get('/my-courses', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener todas las inscripciones del usuario
    const enrollments = await Enrollment.find({ userId: userId });
    
    // Obtener los cursos de las inscripciones
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    const courses = await Course.find({ 
      _id: { $in: courseIds },
      isPublished: true // Solo cursos publicados
    });
    
    // Enriquecer con información de progreso
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const enrollment = enrollments.find(e => e.courseId.toString() === course._id.toString());
        const progress = {
          enrolled: true,
          progress: course.contents?.length > 0 ? 
            Math.round((enrollment.completedContentIds.length / course.contents.length) * 100) : 0,
          completedContents: enrollment.completedContentIds.length,
          totalContents: course.contents?.length || 0,
          lastAccessAt: enrollment.lastAccessAt,
          enrolledAt: enrollment.createdAt
        };
        
        return {
          ...course.toJSON(),
          progress: progress,
          isEnrolled: true
        };
      })
    );
    
    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Error obteniendo mis cursos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default r;
