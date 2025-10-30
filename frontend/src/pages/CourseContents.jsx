// CourseContents.jsx - ACTUALIZADO
import React from "react";
import api from "../api";
import "./CourseContents.css";

export default function CourseContents({ course, userRole, isEnrolled, isInstructor }) {
  
  const handleDownload = async (content) => {
    try {
      // ✅ VERIFICAR DIFERENTES CAMPOS DE ARCHIVO
      const filePath = content.filePath || content.fileUrl?.replace('/uploads/', '');
      
      if (!filePath) {
        alert('Este contenido no tiene archivo asociado');
        return;
      }

      // Para profesores/admin: acceso directo
      if (userRole === 'teacher' || userRole === 'admin' || isInstructor) {
        window.open(`http://localhost:4000/courses/uploads/${filePath}`, '_blank');
        return;
      }

      // Para estudiantes: verificar inscripción y publicación
      if (!isEnrolled) {
        alert('Debes inscribirte en el curso para acceder a los archivos');
        return;
      }

      if (!content.isPublished) {
        alert('Este contenido no está disponible aún');
        return;
      }

      window.open(`http://localhost:4000/courses/uploads/${filePath}`, '_blank');
      
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  const canViewContent = (content) => {
    // Profesores y admin pueden ver todo
    if (userRole === 'teacher' || userRole === 'admin' || isInstructor) return true;
    
    // Estudiantes solo pueden ver contenido publicado si están inscritos
    return isEnrolled && content.isPublished;
  };

  const getVisibleContents = () => {
    if (!course || !course.contents) return [];
    
    // Instructores ven TODOS los contenidos
    if (isInstructor) {
      return course.contents;
    }
    
    // Estudiantes solo ven contenidos PUBLICADOS
    return course.contents.filter(content => 
      content.isPublished === true
    );
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI TIENE ARCHIVO
  const hasFile = (content) => {
    return !!(content.filePath || content.fileUrl);
  };

  // ✅ OBTENER NOMBRE DEL ARCHIVO
  const getFileName = (content) => {
    return content.fileName || content.title || 'archivo';
  };

  // ✅ OBTENER TAMAÑO DEL ARCHIVO
  const getFileSize = (content) => {
    if (content.fileSize) {
      return Math.round(content.fileSize / 1024 / 1024 * 100) / 100;
    }
    return null;
  };

  const visibleContents = getVisibleContents();

  if (!course || !course.contents || course.contents.length === 0) {
    return (
      <div className="course-contents">
        <h2>Contenidos del Curso</h2>
        <div className="empty-contents">
          <p>Este curso aún no tiene contenidos disponibles.</p>
          {isInstructor && (
            <button
              className="add-content-btn"
              onClick={() => window.location.href = `/courses/${course._id}/manage`}
            >
              Agregar Contenido
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="course-contents">
      <h2>Contenidos del Curso ({visibleContents.length})</h2>
      
      <div className="contents-list">
        {visibleContents.map((content, index) => (
          <div 
            key={content._id || index} 
            className={`content-item ${canViewContent(content) ? 'available' : 'locked'}`}
          >
            <div className="content-info">
              <div className="content-header">
                <h4>
                  {index + 1}. {content.title}
                  {!content.isPublished && <span className="badge draft">Borrador</span>}
                  {content.isPublished && <span className="badge published">Publicado</span>}
                </h4>
              </div>
              
              {content.description && (
                <p className="content-description">{content.description}</p>
              )}
              
              <div className="content-meta">
                <span className="content-type">Tipo: {content.type}</span>
                {content.duration > 0 && (
                  <span className="content-duration">Duración: {content.duration} min</span>
                )}
                {/* ✅ MOSTRAR INFORMACIÓN DEL ARCHIVO SI EXISTE */}
                {hasFile(content) && (
                  <>
                    <span className="content-file">
                      Archivo: {getFileName(content)}
                    </span>
                    {getFileSize(content) && (
                      <span className="content-size">
                        Tamaño: {getFileSize(content)} MB
                      </span>
                    )}
                  </>
                )}
              </div>

              {content.instructions && (
                <p className="content-instructions">
                  <strong>Instrucciones:</strong> {content.instructions}
                </p>
              )}
            </div>

            <div className="content-actions">
              {hasFile(content) && canViewContent(content) ? (
                <button 
                  className="download-btn"
                  onClick={() => handleDownload(content)}
                  title={`Descargar ${getFileName(content)}`}
                >
                  📥 Descargar
                </button>
              ) : hasFile(content) ? (
                <button className="locked-btn" disabled>
                  🔒 No disponible
                </button>
              ) : (
                <span className="no-file">Sin archivo</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Información sobre contenidos no visibles */}
      {isInstructor && course.contents.length > visibleContents.length && (
        <div className="contents-notice">
          <p>
            <strong>Nota:</strong> Tienes {course.contents.length - visibleContents.length} 
            contenido(s) en borrador que los estudiantes no pueden ver.
          </p>
        </div>
      )}
    </div>
  );
}