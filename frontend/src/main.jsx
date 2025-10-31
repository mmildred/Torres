import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Courses from './pages/Courses.jsx'
import './styles.css'
import Admin from './pages/Admin.jsx'
import Profile from './pages/Profile.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import CourseNew from './pages/CourseNew.jsx';
import CourseEnrollment from './pages/CourseEnrollment.jsx';
import CourseManage from './pages/CourseManage.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import CourseLearning from './pages/CourseLearning.jsx';
import MyCourses from './pages/MyCourses.jsx'
import ResourceLibrary from './pages/ResourseLibrary.jsx';



console.log('🚀 Inicializando aplicación...');

const originalImage = window.Image;
window.Image = function() {
  const image = new originalImage();
  const originalSetAttribute = image.setAttribute;
  
  image.setAttribute = function(name, value) {
    if (name === 'src' && value && value.includes('pngtree-lettering-hola')) {
      console.log('🚫 Imagen problemática bloqueada');
      return;
    }
    originalSetAttribute.call(this, name, value);
  };
  
  return image;
};

console.log('✅ Interceptor de imágenes instalado');

// if ('serviceWorker' in navigator) { 
//   navigator.serviceWorker.register('/sw.js'); 
// }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App/>}>
        <Route index element={<Home/>} /> 
        <Route path='courses' element={<Courses/>}/>
        <Route path="/courses/new" element={<CourseNew />} /> 
        {/* Rutas específicas primero */}
        <Route path="/courses/:courseId/manage" element={<CourseManage />} />
        <Route path="/courses/:courseId/enroll" element={<CourseEnrollment />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path='/courses/:courseId/learn' element={<CourseLearning/>} />
        <Route path='login' element={<Login/>}/>
        <Route path='register' element={<Register/>}/>
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path='forgot-password' element={<ForgotPassword />} />
        <Route path='reset-password' element={<ResetPassword />} />
        <Route path='my-courses' element={<MyCourses />} />
        <Route path="/library" component={ResourceLibrary} />
      </Route>
    </Routes>
  </BrowserRouter>
);