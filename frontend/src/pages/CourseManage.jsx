import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getUser } from '../auth';
import './CourseManage.css';

export default function CourseManage() {  
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContentForm, setShowContentForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false); 
  const [editingContent, setEditingContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); 
  
  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'video',
    description: '',
    instructions: '',
    duration: 0,
    file: null
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    instructions: '',
    duration: 0,
    file: null
  });

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
      alert('Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const checkPermissions = () => {
    if (!user || !course) return false;
    
    const isAdmin = user.role === 'admin';
    const isOwner = course.owner?._id.toString() === user._id.toString();
    const isInstructor = course.instructors?.some(instructor => 
      instructor._id.toString() === user._id.toString()
    );
    
    return isAdmin || isOwner || isInstructor;
  };

  const handlePublishCourse = async () => {
    try {
      await api.patch(`/courses/${courseId}/publish`);
      await fetchCourseData();
      alert('✅ Curso publicado exitosamente. Los estudiantes ahora pueden verlo.');
    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Error al publicar el curso: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUnpublishCourse = async () => {
    try {
      await api.patch(`/courses/${courseId}/unpublish`);
      await fetchCourseData();
      alert('📝 Curso despublicado. Los estudiantes ya no podrán verlo.');
    } catch (error) {
      console.error('Error unpublishing course:', error);
      alert('Error al despublicar el curso: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (editingContent) {
        await api.put(`/courses/${courseId}/contents/${editingContent._id}`, {
          title: contentForm.title,
          type: contentForm.type,
          description: contentForm.description,
          instructions: contentForm.instructions,
          duration: contentForm.duration
        });
      } else {
        await api.post(`/courses/${courseId}/contents`, {
          title: contentForm.title,
          type: contentForm.type,
          description: contentForm.description,
          instructions: contentForm.instructions,
          duration: contentForm.duration
        });
      }
      
      await fetchCourseData();
      
      setContentForm({
        title: '',
        type: 'video',
        description: '',
        instructions: '',
        duration: 0,
        file: null
      });
      setShowContentForm(false);
      setEditingContent(null);
      
      alert(editingContent ? 'Contenido actualizado exitosamente' : 'Contenido agregado exitosamente');
      
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error al guardar el contenido: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title || uploadForm.file.name);
      formData.append('description', uploadForm.description);
      formData.append('instructions', uploadForm.instructions);
      formData.append('duration', uploadForm.duration);

      await api.post(`/courses/${courseId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await fetchCourseData();
      
      setUploadForm({
        title: '',
        description: '',
        instructions: '',
        duration: 0,
        file: null
      });
      setShowUploadForm(false);
      
      alert('✅ Archivo subido exitosamente');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file,
        title: uploadForm.title || file.name 
      });
    }
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title,
      type: content.type === 'documento' ? 'document' : content.type,
      description: content.description || '',
      instructions: content.instructions || '',
      duration: content.duration || 0,
      file: null
    });
    setShowContentForm(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contenido?')) return;
    
    try {
      await api.delete(`/courses/${courseId}/contents/${contentId}`);
      await fetchCourseData();
      alert('Contenido eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error al eliminar el contenido: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePublishToggle = async (contentId, currentStatus) => {
    try {
      await api.patch(`/courses/${courseId}/contents/${contentId}/toggle-publish`);
      await fetchCourseData();
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Cargando curso...</div>;
  if (!course) return <div className="error">Curso no encontrado</div>;

  const hasPermission = checkPermissions();
  if (!hasPermission) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para gestionar este curso.</p>
        <button onClick={() => navigate('/courses')}>Volver a cursos</button>
      </div>
    );
  }

  const contents = course.contents || [];

  return (
    <div className="course-manage-container">
      <div className="manage-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/courses')}
        >
          ← Volver a cursos
        </button>
        <h1>Gestionar: {course.title}</h1>
        <p>{course.description}</p>
      </div>

      <div className="manage-content">
        {/* ✅ SECCIÓN DE PUBLICACIÓN DEL CURSO */}
        <div className="course-publish-section">
          <h3>Estado del Curso</h3>
          <div className="publish-status">
            <p>
              Estado actual: 
              <strong className={course.isPublished ? 'published' : 'draft'}>
                {course.isPublished ? ' ✅ PUBLICADO' : ' 📝 BORRADOR'}
              </strong>
            </p>
            <p className="status-description">
              {course.isPublished 
                ? 'Los estudiantes pueden ver y inscribirse en este curso.' 
                : 'Los estudiantes NO pueden ver este curso. Debes publicarlo.'
              }
            </p>
            
            <div className="publish-actions">
              {course.isPublished ? (
                <button
                  className="unpublish-course-btn"
                  onClick={handleUnpublishCourse}
                >
                  Despublicar Curso
                </button>
              ) : (
                <button
                  className="publish-course-btn"
                  onClick={handlePublishCourse}
                >
                  Publicar Curso
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas del curso */}
        <div className="course-stats">
          <div className="stat-card">
            <h3>Total de contenidos</h3>
            <span className="stat-number">{contents.length}</span>
          </div>
          <div className="stat-card">
            <h3>Contenidos publicados</h3>
            <span className="stat-number">
              {contents.filter(c => c.isPublished).length}
            </span>
          </div>
          <div className="stat-card">
            <h3>Estudiantes inscritos</h3>
            <span className="stat-number">0</span>
          </div>
        </div>

        {/* ✅ BOTONES PARA AGREGAR CONTENIDO - ACTUALIZADO */}
        <div className="content-actions">
          <button
            className="add-content-btn"
            onClick={() => {
              setEditingContent(null);
              setContentForm({
                title: '',
                type: 'video',
                description: '',
                instructions: '',
                duration: 0,
                file: null
              });
              setShowContentForm(true);
            }}
          >
            + Agregar Contenido (Texto/Quiz)
          </button>
          
          <button
            className="upload-file-btn"
            onClick={() => {
              setUploadForm({
                title: '',
                description: '',
                instructions: '',
                duration: 0,
                file: null
              });
              setShowUploadForm(true);
            }}
          >
            📁 Subir Archivo
          </button>
        </div>

        {/* ✅ FORMULARIO DE SUBIDA DE ARCHIVOS - NUEVO */}
        {showUploadForm && (
          <div className="content-form-modal">
            <div className="modal-content">
              <h2>Subir Archivo</h2>
              <form onSubmit={handleFileUpload}>
                <div className="form-group">
                  <label>Archivo *</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    disabled={uploading}
                  />
                  {uploadForm.file && (
                    <p className="file-info">Archivo seleccionado: {uploadForm.file.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    required
                    disabled={uploading}
                    placeholder="Título del contenido"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    rows="3"
                    disabled={uploading}
                    placeholder="Describe el contenido del archivo..."
                  />
                </div>

                <div className="form-group">
                  <label>Instrucciones para estudiantes</label>
                  <textarea
                    value={uploadForm.instructions}
                    onChange={(e) => setUploadForm({...uploadForm, instructions: e.target.value})}
                    rows="3"
                    placeholder="Describe qué deben hacer los estudiantes con este archivo..."
                    disabled={uploading}
                  />
                </div>

                <div className="form-group">
                  <label>Duración estimada (minutos)</label>
                  <input
                    type="number"
                    value={uploadForm.duration}
                    onChange={(e) => setUploadForm({...uploadForm, duration: parseInt(e.target.value) || 0})}
                    min="0"
                    disabled={uploading}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowUploadForm(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulario de contenido (sin archivo) */}
        {showContentForm && (
          <div className="content-form-modal">
            <div className="modal-content">
              <h2>{editingContent ? 'Editar' : 'Agregar'} Contenido</h2>
              <form onSubmit={handleContentSubmit}>
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de contenido *</label>
                  <select
                    value={contentForm.type}
                    onChange={(e) => setContentForm({...contentForm, type: e.target.value})}
                    disabled={saving}
                  >
                    <option value="video">Video</option>
                    <option value="document">Documento</option>
                    <option value="quiz">Quiz/Evaluación</option>
                    <option value="assignment">Tarea/Actividad</option>
                    <option value="text">Texto/Lección</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={contentForm.description}
                    onChange={(e) => setContentForm({...contentForm, description: e.target.value})}
                    rows="3"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Instrucciones para estudiantes</label>
                  <textarea
                    value={contentForm.instructions}
                    onChange={(e) => setContentForm({...contentForm, instructions: e.target.value})}
                    rows="3"
                    placeholder="Describe qué deben hacer los estudiantes..."
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Duración (minutos)</label>
                  <input
                    type="number"
                    value={contentForm.duration}
                    onChange={(e) => setContentForm({...contentForm, duration: parseInt(e.target.value) || 0})}
                    min="0"
                    disabled={saving}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Guardando...' : (editingContent ? 'Actualizar' : 'Crear') + ' Contenido'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowContentForm(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de contenidos existentes */}
        <div className="contents-list">
          <h2>Contenidos del Curso</h2>
          {contents.length === 0 ? (
            <div className="empty-contents">
              <p>No hay contenidos agregados aún.</p>
              <p>¡Comienza agregando tu primer contenido usando los botones de arriba!</p>
            </div>
          ) : (
            <div className="contents-grid">
              {contents.map((content, index) => (
                <div key={content._id} className="content-card">
                  <div className="content-header">
                    <span className={`content-type-badge ${content.type}`}>
                      {content.type}
                    </span>
                    <span className="content-order">#{index + 1}</span>
                  </div>
                  
                  <h3 className="content-title">{content.title}</h3>
                  <p className="content-description">{content.description}</p>
                  
                  {/* ✅ MOSTRAR INFORMACIÓN DEL ARCHIVO SI EXISTE */}
                  {content.fileName && (
                    <div className="file-info">
                      <strong>Archivo:</strong> {content.fileName}
                      {content.fileSize && (
                        <span> ({(content.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                      )}
                    </div>
                  )}
                  
                  {content.instructions && (
                    <div className="content-instructions">
                      <strong>Instrucciones:</strong> {content.instructions}
                    </div>
                  )}
                  
                  <div className="content-meta">
                    <span>Duración: {content.duration}min</span>
                    <span className={`status ${content.isPublished ? 'published' : 'draft'}`}>
                      {content.isPublished ? '✅ Publicado' : '📝 Borrador'}
                    </span>
                  </div>

                  <div className="content-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditContent(content)}
                    >
                      Editar
                    </button>
                    <button
                      className={`publish-btn ${content.isPublished ? 'unpublish' : 'publish'}`}
                      onClick={() => handlePublishToggle(content._id, content.isPublished)}
                    >
                      {content.isPublished ? 'Ocultar' : 'Publicar'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteContent(content._id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}