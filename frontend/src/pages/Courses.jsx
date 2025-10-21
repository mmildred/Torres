import React, { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const user = getUser();

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await api.get("/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Error cargando cursos:", err);
    }
  }

  return (
    <div className="courses-container">
      <h2 className="title">Catálogo de Cursos</h2>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <p>No hay cursos disponibles.</p>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-image">
                <img
                  src={
                    course.thumbnail ||
                    "https://cdn-icons-png.flaticon.com/512/2972/2972085.png"
                  }
                  alt="Curso"
                />
              </div>
              <div className="course-info">
                <h3>{course.title}</h3>
                <p className="teacher">
                  👨‍🏫 Profesor:{" "}
                  <span>{course.owner?.name || "No asignado"}</span>
                </p>
                <p className="desc">
                  {course.description?.slice(0, 80) || "Sin descripción..."}...
                </p>
                <button className="details-btn">Ver detalles</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
