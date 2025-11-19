import express from 'express';
import { auth } from '../../middleware/auth.js';
import User from './user.model.js';
import { InviteCode } from './InviteCode.model.js';
import Course from '../courses/course.model.js';

const router = express.Router();


router.use(auth());

router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    const totalCodes = await InviteCode.countDocuments();
    const usedCodes = await InviteCode.countDocuments({ used: true });
    const activeCodes = await InviteCode.countDocuments({ 
      used: false, 
      expiresAt: { $gt: new Date() } 
    });

    const totalCourses = await Course.countDocuments();

    res.json({
      users: {
        total: totalUsers,
        teachers: totalTeachers,
        students: totalStudents
      },
      inviteCodes: {
        total: totalCodes,
        used: usedCodes,
        active: activeCodes
      },
      courses: {
        total: totalCourses
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
});

router.get('/invite-codes', async (req, res) => {
  try {
    const codes = await InviteCode.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(codes);
  } catch (error) {
    console.error('Error getting invite codes:', error);
    res.status(500).json({ message: 'Error obteniendo códigos' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({ message: 'Error obteniendo cursos' });
  }
});

// ✅ NUEVA RUTA PARA ELIMINAR CURSOS
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verificar que el curso existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Eliminar el curso
    await Course.findByIdAndDelete(courseId);
    
    res.json({ message: 'Curso eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error eliminando curso' });
  }
});

export default router;