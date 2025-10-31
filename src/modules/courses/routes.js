import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Course from './course.model.js';
import Enrollment from './enrollment.model.js';
import { auth } from '../../middleware/auth.js';
import User from '../auth/user.model.js';
import express from 'express';
import File from './content.model.js';

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
    
    if (req.user) {
      if (req.user.role === 'teacher' || req.user.role === 'admin') {
        filter = {
          $or: [
            { isPublished: true }, 
            { 
              $or: [
                { 'owner._id': req.user.id }, 
                { 'instructors._id': req.user.id } 
              ]
            }
          ]
        };
      } else {
        filter = { isPublished: true };
      }
    } else {
      filter = { isPublished: true };
    }

    console.log("🔍 Filtro aplicado para usuario:", req.user?.id);
    console.log("📋 Filtro:", JSON.stringify(filter));
    
    const list = await Course.find(filter).sort({ createdAt: -1 });
    console.log("📊 Cursos encontrados:", list.length);
    
    list.forEach(course => {
      console.log(`📖 Curso: "${course.title}" - Publicado: ${course.isPublished} - Owner: ${course.owner?._id}`);
    });

    res.json(list.map(x => x.toJSON()));
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// RUTA PARA OBTENER CURSO INDIVIDUAL
r.get('/:id', auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    const isAdmin = req.user.role === 'admin';
    
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
      isPublished: true, 
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

// RUTA PARA SUBIR ARCHIVOS
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

    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para subir archivos' });
    }

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



// RUTA ARCHIVOS SUBIDOS
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

// RUTA DE INSCRIPCIÓN 
r.post('/:courseId/enroll', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

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

// RUTA PARA VERIFICAR INSCRIPCIÓN 
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

// PUBLICAR CURSO
r.patch('/:courseId/publish', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

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

r.patch('/:courseId/unpublish', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

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

// RUTA PARA MANIFEST
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

// CREAR CONTENIDO SIN ARCHIVO
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

// ACTUALIZAR CONTENIDO
r.put('/:courseId/contents/:contentId', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const updateData = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para editar contenido' });
    }

    const contentIndex = course.contents.findIndex(content => 
      content._id.toString() === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Contenido no encontrado' });
    }

    
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

r.delete('/:courseId/contents/:contentId', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }


    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar contenido' });
    }

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

r.patch('/:courseId/contents/:contentId/toggle-publish', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const isOwner = course.owner._id.toString() === req.user.id;
    const isInstructor = course.instructors.some(instructor => 
      instructor._id.toString() === req.user.id
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para publicar contenido' });
    }

    const contentIndex = course.contents.findIndex(content => 
      content._id.toString() === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Contenido no encontrado' });
    }

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

    if (!enrollment.completedContentIds.includes(contentId)) {
      enrollment.completedContentIds.push(contentId);
      await enrollment.save();
    }

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

    enrollment.completedContentIds = enrollment.completedContentIds.filter(
      id => id.toString() !== contentId
    );
    await enrollment.save();

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
      enrollment.submissions[existingSubmissionIndex] = submissionData;
    } else {
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

    const enrollments = await Enrollment.find({ userId: userId });
    
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    const courses = await Course.find({ 
      _id: { $in: courseIds },
      isPublished: true 
    });
    
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

r.get('/files/available', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar cursos donde el usuario está inscrito
    const userEnrollments = await Enrollment.find({ userId: userId });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    
    // Buscar cursos públicos o donde el usuario está inscrito
    const courses = await Course.find({
      $or: [
        { isPublished: true },
        { _id: { $in: enrolledCourseIds } }
      ]
    });
    
    // Extraer todos los archivos de contenido
    const allFiles = [];
    courses.forEach(course => {
      course.contents.forEach(content => {
        if (content.filePath && content.isPublished) {
          allFiles.push({
            _id: content._id,
            title: content.title,
            fileType: content.type || 'document',
            fileSize: content.fileSize || 0,
            filePath: content.filePath,
            fileName: content.fileName,
            subject: course.category,
            educationalLevel: course.level,
            courseId: course._id,
            courseTitle: course.title,
            createdAt: content.createdAt
          });
        }
      });
    });

    res.json(allFiles);
  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({ message: 'Error al obtener archivos', error: error.message });
  }
});

// Descargar archivo individual
r.get('/files/:fileId/download', auth(), async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Buscar en todos los cursos
    const courses = await Course.find({
      'contents._id': fileId,
      $or: [
        { isPublished: true },
        { 'enrollments.userId': userId }
      ]
    });

    let targetContent = null;
    let targetCourse = null;

    // Encontrar el contenido específico
    for (const course of courses) {
      const content = course.contents.find(c => c._id.toString() === fileId);
      if (content && content.filePath) {
        targetContent = content;
        targetCourse = course;
        break;
      }
    }

    if (!targetContent) {
      return res.status(404).json({ message: 'Archivo no encontrado o sin permisos' });
    }

    const filePath = path.join(uploadDir, targetContent.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo físico no encontrado' });
    }

    // Registrar descarga (puedes agregar esta lógica si quieres tracking)
    console.log(`📥 Usuario ${userId} descargó: ${targetContent.title}`);

    // Enviar archivo
    res.download(filePath, targetContent.fileName || targetContent.title);

  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({ message: 'Error al descargar archivo', error: error.message });
  }
});

// Obtener archivos ya descargados por el usuario
r.get('/files/my-downloads', auth(), async (req, res) => {
  try {
    // Esta sería una implementación básica - puedes expandirla con tracking en BD
    const userId = req.user.id;
    
    const userEnrollments = await Enrollment.find({ userId: userId });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    
    const courses = await Course.find({
      _id: { $in: enrolledCourseIds }
    });
    
    const downloadedFiles = [];
    courses.forEach(course => {
      course.contents.forEach(content => {
        if (content.filePath) {
          downloadedFiles.push({
            fileId: content._id,
            title: content.title,
            fileType: content.type || 'document',
            fileSize: content.fileSize || 0,
            courseTitle: course.title,
            downloadedAt: new Date() // Podrías guardar esto en BD
          });
        }
      });
    });

    res.json(downloadedFiles);
  } catch (error) {
    console.error('Error al obtener descargas:', error);
    res.status(500).json({ message: 'Error al obtener descargas', error: error.message });
  }
});

export default r;
