import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Course from './course.model.js';
import Enrollment from './enrollment.model.js';
import { auth } from '../../middleware/auth.js';
import User from '../auth/user.model.js';
import { enhanceAnalyticsWithAI} from '../../utils/analytics-decorators.js';

const r = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

r.use((req, res, next) => {
  console.log(`📍 [${req.method}] ${req.originalUrl}`);
  console.log('👤 User:', req.user?.id);
  next();
});


r.get('/files/available', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const userEnrollments = await Enrollment.find({ userId: userId });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    
    const courses = await Course.find({
      $or: [
        { isPublished: true },
        { _id: { $in: enrolledCourseIds } }
      ]
    });
    
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

r.get('/files/my-downloads', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const userEnrollments = await Enrollment.find({ userId: userId });
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    
    const courses = await Course.find({ _id: { $in: enrolledCourseIds } });
    
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
            downloadedAt: new Date()
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

r.get('/files/:fileId/download', (req, res, next) => {

  const tokenFromQuery = req.query.token;
  if (tokenFromQuery && !req.headers.authorization) {
    console.log('🔐 Usando token desde query parameter');
    req.headers.authorization = `Bearer ${tokenFromQuery}`;
  } else if (req.headers.authorization) {
    console.log('🔐 Usando token desde headers');
  } else {
    console.log('⚠️ No se encontró token en headers ni query');
  }
  
  next();
}, auth(), async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    console.log("📥 Solicitud de descarga:", { 
      fileId, 
      userId,
      authSource: req.query.token ? 'query' : 'header'
    });

    const courses = await Course.find({
      'contents._id': fileId
    });

    let targetContent = null;
    let targetCourse = null;

    // Encontrar el contenido específico
    for (const course of courses) {
      const content = course.contents.find(c => 
        c._id && c._id.toString() === fileId
      );
      if (content && content.filePath) {
        targetContent = content;
        targetCourse = course;
        break;
      }
    }

    if (!targetContent) {
      console.log(" Archivo no encontrado en BD:", fileId);
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    
    const isEnrolled = await Enrollment.findOne({
      courseId: targetCourse._id,
      userId: userId
    });

    const isOwner = targetCourse.owner && targetCourse.owner._id.toString() === userId;
    const isInstructor = targetCourse.instructors && targetCourse.instructors.some(instructor => 
      instructor._id && instructor._id.toString() === userId
    );
    const isAdmin = req.user.role === 'admin';

    const hasAccess = targetCourse.isPublished || isOwner || isInstructor || isAdmin || isEnrolled;
    
    if (!hasAccess) {
      console.log(" Sin permisos para descargar");
      return res.status(403).json({ message: 'No tienes permisos para descargar este archivo' });
    }

    const filePath = path.join(uploadDir, targetContent.filePath);
    
    console.log("🔍 Buscando archivo en:", filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log("❌ Archivo físico no encontrado:", filePath);
      return res.status(404).json({ message: 'Archivo físico no encontrado' });
    }

    console.log("✅ Enviando archivo:", targetContent.title);
    
    const filename = encodeURIComponent(targetContent.fileName || targetContent.title);
    
    const ext = path.extname(targetContent.fileName || '').toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.mp4': 'video/mp4',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.zip': 'application/zip'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', targetContent.fileSize || fs.statSync(filePath).size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('❌ Error leyendo archivo:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error al leer archivo' });
      }
    });
    
    fileStream.pipe(res);
    
    res.on('finish', () => {
      console.log('✅ Archivo enviado exitosamente');
    });

  } catch (error) {
    console.error('❌ Error al descargar archivo:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error al descargar archivo', 
        error: error.message 
      });
    }
  }
});

// 2. MIS CURSOS
r.get('/my-courses', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔍 Buscando cursos para usuario: ${userId}`);

    const enrollments = await Enrollment.find({ userId: userId });
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    console.log(`📋 IDs de cursos inscritos: ${courseIds.length}`);
    
    const courses = await Course.find({ 
      _id: { $in: courseIds },
      isPublished: true 
    });
    
    console.log(`🎯 Cursos encontrados: ${courses.length}`);
    
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
    
    console.log(`✅ Enviando ${coursesWithProgress.length} cursos al frontend`);
    res.json(coursesWithProgress);
  } catch (error) {
    console.error('❌ Error obteniendo mis cursos:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// 3. ESTADÍSTICAS DE INSTRUCTOR
r.get('/instructor/stats', auth('teacher'), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Cargando estadísticas para instructor: ${userId}`);
    
    const myCourses = await Course.find({ 
      'owner._id': userId 
    });
    
    console.log(`📚 Cursos encontrados: ${myCourses.length}`);
    
    const courseIds = myCourses.map(course => course._id);
    
    const enrollments = await Enrollment.find({ 
      courseId: { $in: courseIds } 
    });
    
    console.log(`👥 Inscripciones encontradas: ${enrollments.length}`);
    
    const studentsByCourse = {};
    enrollments.forEach(enrollment => {
   
      const courseId = enrollment.courseId ? enrollment.courseId.toString() : null;
      if (courseId) {
        if (!studentsByCourse[courseId]) {
          studentsByCourse[courseId] = new Set();
        }
  
        if (enrollment.userId) {
          studentsByCourse[courseId].add(enrollment.userId.toString());
        }
      }
    });
    
    const coursesWithStats = myCourses.map(course => {
      const courseId = course._id ? course._id.toString() : null;
      const studentCount = courseId && studentsByCourse[courseId] ? studentsByCourse[courseId].size : 0;
      
      return {
        ...course.toJSON(),
        studentCount: studentCount
      };
    });
    
    const uniqueStudents = new Set();
    enrollments.forEach(enrollment => {
      if (enrollment.userId) {
        uniqueStudents.add(enrollment.userId.toString());
      }
    });

    const totalStudents = uniqueStudents.size;
    const totalEnrollments = enrollments.length;

    console.log(`✅ Estadísticas calculadas: ${coursesWithStats.length} cursos, ${totalStudents} estudiantes únicos`);
    
    res.json({
      totalCourses: myCourses.length,
      totalStudents: totalStudents,
      totalEnrollments: totalEnrollments,
      courses: coursesWithStats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de instructor:', error);
    res.status(500).json({ 
      message: 'Error del servidor al cargar estadísticas',
      error: error.message 
    });
  }
});

r.get('/instructor/my-courses', auth(), async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    console.log(` Buscando cursos del instructor: ${instructorId}`);
    
    const courses = await Course.find({ 
      'owner._id': instructorId 
    })
    .sort({ createdAt: -1 });

    console.log(` Encontrados ${courses.length} cursos del instructor`);

    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        try {
          const enrollments = await Enrollment.find({ courseId: course._id });
          const studentCount = enrollments.length;
          
          let avgProgress = 0;
          if (studentCount > 0) {
            const totalProgress = enrollments.reduce((sum, enrollment) => 
              sum + (enrollment.progress || 0), 0
            );
            avgProgress = totalProgress / studentCount;
          }

          return {
            ...course.toJSON(),
            studentCount,
            avgProgress: Math.round(avgProgress),
            totalEnrollments: studentCount
          };
        } catch (error) {
          console.error(`Error procesando curso ${course._id}:`, error);
          return {
            ...course.toJSON(),
            studentCount: 0,
            avgProgress: 0,
            totalEnrollments: 0
          };
        }
      })
    );

    console.log(`✅ Enviando ${coursesWithStats.length} cursos con estadísticas`);
    res.json(coursesWithStats);
  } catch (error) {
    console.error('❌ Error cargando cursos del instructor:', error);
    res.status(500).json({ 
      error: 'Error al cargar los cursos del instructor',
      details: error.message 
    });
  }
});

// 4. CREAR CURSO (POST antes de las rutas GET con parámetros)
r.post('/', auth('teacher'), async (req, res) => {
  try {
    console.log("📥 RECIBIENDO PETICIÓN PARA CREAR CURSO");
    const { title, description, category, level, duration, thumbnail } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Título requerido' });
    }

    const creator = await User.findById(req.user.id);
    if (!creator) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

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

    const course = await Course.create(courseData);
    res.status(201).json(course.toJSON());
    
  } catch (error) {
    console.error("❌ ERROR creando curso:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Error de validación', errors });
    }
    
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// 5. LISTADO GENERAL DE CURSOS
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

    const list = await Course.find(filter).sort({ createdAt: -1 });
    res.json(list.map(x => x.toJSON()));
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


r.get('/:courseId/analytics', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`📊 Analytics solicitado - Curso: ${courseId}, Usuario: ${userId}`);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificación de permisos
    const isOwner = course.owner && course.owner._id && course.owner._id.toString() === userId;
    const isInstructor = course.instructors && course.instructors.some(instructor => 
      instructor._id && instructor._id.toString() === userId
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para ver estas estadísticas' });
    }

    const enrollments = await Enrollment.find({ courseId: courseId });
    console.log(`👥 Inscripciones encontradas: ${enrollments.length}`);

    // ✅ CORREGIDO: Buscar por AMBOS campos (studentId O userId)
    const userIds = enrollments.map(e => e.studentId || e.userId).filter(id => id);
    console.log(`📋 IDs de usuario encontrados: ${userIds.length}`);
    
    const users = await User.find({ _id: { $in: userIds } });
    console.log(`👤 Usuarios cargados: ${users.length}`);
    
    const userMap = {};
    users.forEach(user => {
      if (user && user._id) {
        userMap[user._id.toString()] = user;
      }
    });

    // ✅ CORREGIDO: Procesar estudiantes usando AMBOS campos
    const studentsProgress = enrollments.map((enrollment) => {
      // Usar studentId primero, si no existe usar userId
      const userIdentifier = enrollment.studentId || enrollment.userId;
      const userId = userIdentifier ? userIdentifier.toString() : null;
      const user = userId ? userMap[userId] : null;
      
      // Filtrar si no hay usuario válido
      if (!user) {
        console.log(`👻 Inscripción sin usuario - Enrollment: ${enrollment._id}`);
        return null;
      }
      
      const completedContents = enrollment.completedContentIds?.length || 0;
      const totalContents = course.contents?.length || 1;
      const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
      
      let status = 'beginner';
      if (progress === 0) status = 'not-started';
      else if (progress >= 80) status = 'advanced';
      else if (progress >= 40) status = 'intermediate';

      return {
        studentId: userIdentifier || enrollment._id,
        name: user.name,
        email: user.email,
        progress: progress,
        completedContents: completedContents,
        totalContents: totalContents,
        lastActivity: enrollment.lastAccessAt || enrollment.updatedAt || enrollment.createdAt,
        enrolledAt: enrollment.createdAt,
        status: status
      };
    }).filter(student => student !== null);

    const totalStudents = studentsProgress.length;
    const avgProgress = totalStudents > 0 
      ? Math.round(studentsProgress.reduce((sum, student) => sum + student.progress, 0) / totalStudents)
      : 0;
    
    const completedStudents = studentsProgress.filter(s => s.progress === 100).length;
    const activeStudents = studentsProgress.filter(s => s.progress > 0 && s.progress < 100).length;
    const notStartedStudents = studentsProgress.filter(s => s.progress === 0).length;
    const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

    // ✅ ESTRUCTURA BASE DE ANALYTICS
    const basicAnalytics = {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description || '',
        totalContents: course.contents?.length || 0
      },
      summary: {
        totalStudents: totalStudents,
        averageProgress: avgProgress,
        completedStudents: completedStudents,
        activeStudents: activeStudents,
        notStartedStudents: notStartedStudents,
        completionRate: completionRate
      },
      students: studentsProgress.sort((a, b) => b.progress - a.progress)
    };

    // ✅ APLICAR DECORATORS INTELIGENTES
    console.log("🤖 Aplicando análisis inteligente...");
    const enhancedAnalytics = enhanceAnalyticsWithAI(basicAnalytics);
    const insights = enhancedAnalytics.getInsights();

    const response = {
      courseId: course._id,
      courseTitle: course.title,
      courseDescription: course.description || '',
      totalContents: course.contents?.length || 0,
      totalStudents: totalStudents,
      averageProgress: avgProgress,
      completedStudents: completedStudents,
      activeStudents: activeStudents,
      notStartedStudents: notStartedStudents,
      completionRate: completionRate,
      students: studentsProgress.sort((a, b) => b.progress - a.progress),
      // ✅ NUEVO: Insights inteligentes
      insights: insights,
      generatedAt: new Date().toISOString(),
      hasAIInsights: insights.length > 0
    };

    console.log(`✅ Analytics generados: ${studentsProgress.length} estudiantes, ${insights.length} insights inteligentes`);
    res.json(response);

  } catch (error) {
    console.error('❌ ERROR en analytics:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

r.get('/:courseId/enrollments', auth('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`📋 Enrollments solicitados - Curso: ${courseId}, Usuario: ${userId}`);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificación de permisos
    const isOwner = course.owner && course.owner._id && course.owner._id.toString() === userId;
    const isInstructor = course.instructors && course.instructors.some(instructor => 
      instructor._id && instructor._id.toString() === userId
    );
    
    if (!isOwner && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para ver estas inscripciones' });
    }

    const enrollments = await Enrollment.find({ courseId: courseId });
    console.log(`📋 Inscripciones encontradas: ${enrollments.length}`);

    // ✅ CORREGIDO: Buscar por AMBOS campos (studentId O userId)
    const userIds = enrollments.map(e => e.studentId || e.userId).filter(id => id);
    console.log(`👤 IDs de usuario encontrados: ${userIds.length}`);
    
    const users = await User.find({ _id: { $in: userIds } });
    console.log(`👤 Usuarios cargados: ${users.length}`);
    
    const userMap = {};
    users.forEach(user => {
      if (user && user._id) {
        userMap[user._id.toString()] = user;
      }
    });
    
    const enrichedEnrollments = enrollments.map(enrollment => {
      
      const userIdentifier = enrollment.studentId || enrollment.userId;
      const userId = userIdentifier ? userIdentifier.toString() : null;
      const user = userId ? userMap[userId] : null;
    
      if (!user) {
        console.log(`👻 Enrollment sin usuario - Enrollment: ${enrollment._id}`);
        return null;
      }
      
      const totalContents = course.contents?.length || 1;
      const completedContents = enrollment.completedContentIds?.length || 0;
      const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

      return {
        _id: enrollment._id,
        student: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        progress: progress,
        completedContents: completedContents,
        totalContents: totalContents,
        lastAccess: enrollment.lastAccessAt || enrollment.updatedAt || enrollment.createdAt,
        enrolledAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt
      };
    }).filter(enrollment => enrollment !== null);

    console.log(`✅ Enrollments enriquecidos: ${enrichedEnrollments.length} válidos de ${enrollments.length} inscripciones`);
    res.json(enrichedEnrollments);

  } catch (error) {
    console.error('❌ ERROR obteniendo enrollments:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

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

// SUBIR ARCHIVOS
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
      if (['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'].includes(ext)) return 'document';
      if (['.mp4', '.avi', '.mov', '.wmv', '.flv'].includes(ext)) return 'video';
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'image';
      return 'document';
    };

    const newContent = {
      title: title || file.originalname,
      type: getFileType(file.originalname),
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

// En la ruta de inscripción - CORREGIDO
r.post('/:courseId/enroll', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id.toString();

    console.log('📥 Solicitud de inscripción:', { 
      courseId, 
      userId,
      userObject: req.user 
    });

    // Validar ID de curso
    if (!courseId || !courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'ID de curso inválido',
        receivedId: courseId 
      });
    }

    // Buscar el curso
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Verificar si el curso está publicado
    if (!course.isPublished) {
      return res.status(403).json({ 
        message: 'Este curso no está disponible para inscripción' 
      });
    }

    // Verificar si ya está inscrito
    const existingEnrollment = await Enrollment.findOne({ 
      courseId: courseId, 
      userId: userId 
    });

    if (existingEnrollment) {
      console.log('⚠️ Usuario ya inscrito');
      return res.status(400).json({ 
        message: 'Ya estás inscrito en este curso',
        enrollment: existingEnrollment 
      });
    }

    // Crear nueva inscripción
    const newEnrollment = await Enrollment.create({
      courseId: courseId,
      userId: userId,
      completedContentIds: [],
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessAt: new Date()
    });

    console.log('✅ Inscripción exitosa:', newEnrollment._id);

    res.status(201).json({
      success: true,
      message: 'Inscripción exitosa',
      enrollment: newEnrollment,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description
      }
    });

  } catch (error) {
    console.error('❌ Error en inscripción:', error);
    
    // Manejo específico de errores
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Error de validación',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'ID de curso inválido' 
      });
    }

    res.status(500).json({ 
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// ✅ RUTA AUXILIAR: Verificar estado de inscripción (útil para debugging)
r.get('/:courseId/enrollment/status', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    const enrollment = await Enrollment.findOne({ courseId, userId });

    res.json({
      courseExists: !!course,
      coursePublished: course?.isPublished || false,
      isEnrolled: !!enrollment,
      enrollmentDetails: enrollment || null
    });
  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});
// VERIFICAR INSCRIPCIÓN
r.get('/:courseId/enrollment/check', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ courseId, userId });
    res.json({ 
      isEnrolled: !!enrollment,
      enrollment: enrollment || null
    });
  } catch (error) {
    console.error('Error verificando inscripción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// PROGRESO DEL USUARIO
r.get('/:courseId/progress/me', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const enrollment = await Enrollment.findOne({ courseId, userId });

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

// CREAR CONTENIDO
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

// ACTUALIZAR CONTENIDO - VERSIÓN CORREGIDA
r.put('/:courseId/contents/:contentId', auth('teacher'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const updateData = req.body;

    console.log("🔄 Actualizando contenido:", { courseId, contentId, updateData });

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

    // ✅ CORRECCIÓN: Actualizar solo los campos proporcionados
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        course.contents[contentIndex][key] = updateData[key];
      }
    });

    course.contents[contentIndex].updatedAt = new Date();
    
    await course.save();
    
    console.log("✅ Contenido actualizado exitosamente");
    
    // ✅ CORRECCIÓN: Devolver el contenido actualizado específico
    const updatedContent = course.contents[contentIndex];
    res.json({
      success: true,
      content: updatedContent,
      course: course.toJSON()
    });

  } catch (error) {
    console.error('❌ Error actualizando contenido:', error);
    
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

// ELIMINAR CONTENIDO
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

// TOGGLE PUBLISH CONTENIDO
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

// COMPLETAR CONTENIDO
r.post('/:courseId/contents/:contentId/complete', auth(), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ courseId, userId });

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

// DESCOMPLETAR CONTENIDO
r.post('/:courseId/contents/:contentId/uncomplete', auth(), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ courseId, userId });

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

// ENTREGAR CONTENIDO
r.post('/:courseId/contents/:contentId/submit', auth(), upload.single('file'), async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;
    const { comments } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Archivo requerido para entrega' });
    }

    const enrollment = await Enrollment.findOne({ courseId, userId });

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

// OBTENER ENTREGAS
r.get('/:courseId/submissions/me', auth(), async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ courseId, userId });

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

// DESPUBLICAR CURSO
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

// OBTENER CURSO INDIVIDUAL - DEBE IR AL FINAL
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

export default r