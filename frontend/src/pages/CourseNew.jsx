import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./CourseNew.css";

export default function CourseNew() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    duration: "",
    thumbnail: "",
    // Nuevos campos para el período del curso
    hasEndDate: false,
    enrollmentEndDate: "",
    courseEndDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = getUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("📝 Enviando datos del curso:", formData);
      
      // Validar fechas si están habilitadas
      if (formData.hasEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!formData.enrollmentEndDate || !formData.courseEndDate) {
          throw new Error('Ambas fechas son requeridas cuando se activa el período límite');
        }

        const enrollmentDate = new Date(formData.enrollmentEndDate);
        const courseEndDate = new Date(formData.courseEndDate);

        if (enrollmentDate < today) {
          throw new Error('La fecha límite de inscripción no puede ser en el pasado');
        }

        if (courseEndDate <= enrollmentDate) {
          throw new Error('La fecha de cierre del curso debe ser después de la fecha límite de inscripción');
        }
      }

      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        // Si no tiene fecha límite, limpiar los campos
        enrollmentEndDate: formData.hasEndDate ? formData.enrollmentEndDate : null,
        courseEndDate: formData.hasEndDate ? formData.courseEndDate : null
      };
      
      const response = await api.post("/courses", dataToSend);
      console.log("✅ Curso creado exitosamente:", response.data);
      
      alert("🎉 Curso creado exitosamente");
      
      setTimeout(() => {
        navigate("/courses", { 
          state: { shouldRefresh: true } 
        });
      }, 1000);
      
    } catch (err) {
      console.error("❌ Error creando curso:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error al crear el curso";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/courses");
  };

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    return (
      <div className="course-new-container">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para crear cursos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-new-container">
      <div className="course-new-header">
        <h2>Crear Nuevo Curso</h2>
        <p>Completa la información para crear un nuevo curso</p>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>📝 Información Básica del Curso</h3>
          
          <div className="form-group">
            <label htmlFor="title">Título del Curso *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength="3"
              placeholder="Ingresa el título del curso"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe el contenido y objetivos del curso"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoría *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="Ej: Programación, Diseño, Marketing"
              />
            </div>

            <div className="form-group">
              <label htmlFor="level">Nivel *</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duración *</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                placeholder="Ej: 4 semanas, 30 horas, Auto-guiado"
              />
            </div>

            <div className="form-group">
              <label htmlFor="thumbnail">URL de la Miniatura</label>
              <input
                type="url"
                id="thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Período del Curso */}
        <div className="form-section">
          <h3>📅 Período del Curso (Opcional)</h3>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasEndDate"
                checked={formData.hasEndDate}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Establecer período límite para este curso
            </label>
            <small className="help-text">
              Si activas esta opción, el curso tendrá fechas específicas de inscripción y cierre.
              Si no la activas, el curso permanecerá abierto indefinidamente.
            </small>
          </div>

          {formData.hasEndDate && (
            <div className="date-fields">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="enrollmentEndDate">Fecha Límite de Inscripción *</label>
                  <input
                    type="date"
                    id="enrollmentEndDate"
                    name="enrollmentEndDate"
                    value={formData.enrollmentEndDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required={formData.hasEndDate}
                  />
                  <small className="help-text">
                    Último día para que los estudiantes se inscriban en el curso
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="courseEndDate">Fecha de Cierre del Curso *</label>
                  <input
                    type="date"
                    id="courseEndDate"
                    name="courseEndDate"
                    value={formData.courseEndDate}
                    onChange={handleChange}
                    min={formData.enrollmentEndDate || new Date().toISOString().split('T')[0]}
                    required={formData.hasEndDate}
                  />
                  <small className="help-text">
                    Fecha cuando el curso se cerrará completamente y los estudiantes ya no podrán acceder al contenido
                  </small>
                </div>
              </div>

              {/* Preview de las fechas seleccionadas */}
              {formData.enrollmentEndDate && formData.courseEndDate && (
                <div className="dates-preview">
                  <h4>📋 Resumen del Período:</h4>
                  <div className="preview-item">
                    <span>📅 Inscripciones abiertas hasta:</span>
                    <strong>{new Date(formData.enrollmentEndDate).toLocaleDateString('es-ES')}</strong>
                  </div>
                  <div className="preview-item">
                    <span>🔒 Curso cierra el:</span>
                    <strong>{new Date(formData.courseEndDate).toLocaleDateString('es-ES')}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información del creador - solo lectura */}
        <div className="creator-info">
          <h4>👤 Información del Instructor</h4>
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Cargo:</strong> {user.role === "admin" ? "Administrador" : "Instructor"}</p>
          <p><strong>Nota:</strong> Serás asignado como instructor principal de este curso</p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creando Curso...
              </>
            ) : (
              'Crear Curso'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}