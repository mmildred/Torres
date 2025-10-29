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
    thumbnail: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = getUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/courses", formData);
      alert("Curso creado exitosamente");
      navigate("/courses");
    } catch (err) {
      console.error("Error creando curso:", err);
      setError(err.response?.data?.message || "Error al crear el curso");
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

        <div className="form-group">
          <label htmlFor="title">Título del Curso *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
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

        {/* Información del creador - solo lectura */}
        <div className="creator-info">
          <h4>Información del Instructor</h4>
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
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Curso"}
          </button>
        </div>
      </form>
    </div>
  );
}