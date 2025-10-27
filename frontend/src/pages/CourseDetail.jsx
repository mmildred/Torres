import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percent: 0 });
  const [enrolled, setEnrolled] = useState(false);
  const [stats, setStats] = useState(null); // solo owner/admin

  const isOwnerOrAdmin = useMemo(() => {
    const role = user?.role?.toLowerCase();
    if (!course) return false;
    return role === "admin" || String(course.owner?._id) === String(user?.id);
  }, [course, user]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Inicia sesión" } });
      return;
    }
    (async () => {
      try {
        setLoading(true);
        // 1) Curso + contenidos
        const { data: detail } = await api.get(`/courses/${courseId}`);
        setCourse(detail.course);
        setContents(detail.contents || []);
        // 2) Mi progreso (si soy alumno/profesor también responde)
        const { data: prog } = await api.get(`/courses/${courseId}/progress/me`);
        setProgress(prog);
        // 3) Saber si ya estoy inscrito (heurística: si existe progreso o pídelo a enroll)
        setEnrolled(true); // si tienes endpoint extra, cámbialo por el real
        // 4) Stats solo para owner/admin
        const role = user?.role?.toLowerCase();
        if (role === "admin" || String(detail.course.owner?._id) === String(user?.id)) {
          const { data: s } = await api.get(`/courses/${courseId}/stats`);
          setStats(s);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, navigate, user]);

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrolled(true);
      // refresca progreso
      const { data: prog } = await api.get(`/courses/${courseId}/progress/me`);
      setProgress(prog);
      alert("Inscripción exitosa.");
    } catch (e) {
      console.error(e);
      alert("No se pudo inscribir.");
    }
  };

  const markCompleted = async (contentId) => {
    try {
      await api.post(`/courses/${courseId}/progress/complete`, { contentId });
      const { data: prog } = await api.get(`/courses/${courseId}/progress/me`);
      setProgress(prog);
    } catch (e) {
      console.error(e);
      alert("No se pudo marcar como completado.");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando curso…</div>;
  if (!course) return <div style={{ padding: 24 }}>Curso no encontrado.</div>;

  return (
    <div className="course-detail">
      <div className="cd-header">
        <div className="cd-title-wrap">
          <h1 className="cd-title">{course.title}</h1>
          <p className="cd-sub">{course.description || "Sin descripción"}</p>
          <div className="cd-meta">
            <span className="cd-chip">{course.category || "General"}</span>
            <span className="cd-chip">{course.level || "Principiante"}</span>
            <span className="cd-owner">
              Creado por: <strong>{course.owner?.name || "Administrador"}</strong>
            </span>
          </div>
        </div>

        <div className="cd-actions">
          {!enrolled && (
            <button className="cd-btn primary" onClick={handleEnroll}>
              Inscribirme
            </button>
          )}
          {isOwnerOrAdmin && (
            <button className="cd-btn" onClick={() => navigate(`/courses/${courseId}/manage`)}>
              Administrar contenido
            </button>
          )}
        </div>
      </div>

      <div className="cd-progress">
        <div className="cd-progress-top">
          <span>Progreso</span>
          <strong>{progress.percent || 0}%</strong>
        </div>
        <div className="progress-bar">
          <div style={{ width: `${progress.percent || 0}%` }} />
        </div>
        <div className="cd-progress-bottom">
          {progress.completed}/{progress.total} contenidos completados
        </div>
      </div>

      <div className="cd-body">
        <h2 className="cd-section-title">Contenido del curso</h2>

        {contents.length === 0 ? (
          <div className="cd-empty">Aún no hay contenidos.</div>
        ) : (
          <ul className="content-list">
            {contents.map((c) => (
              <li key={c._id} className="content-item">
                <div className="ci-main">
                  <div className="ci-title">
                    {c.title}
                    <span className={`ci-type ${c.type}`}>{c.type}</span>
                  </div>
                  {c.type === "text" && c.text && (
                    <p className="ci-text">{c.text.slice(0, 180)}{c.text.length > 180 ? "…" : ""}</p>
                  )}
                  {c.type === "link" && c.url && (
                    <a className="ci-link" href={c.url} target="_blank" rel="noreferrer">
                      Abrir recurso externo
                    </a>
                  )}
                  {c.type === "file" && c.filePath && (
                    <a className="ci-link" href={c.filePath} target="_blank" rel="noreferrer">
                      Descargar/Ver archivo
                    </a>
                  )}
                </div>
                <div className="ci-actions">
                  {user?.role?.toLowerCase() === "alumno" && (
                    <button className="cd-btn small" onClick={() => markCompleted(c._id)}>
                      Marcar completado
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwnerOrAdmin && stats && (
        <div className="cd-stats">
          <h2 className="cd-section-title">Estadísticas del curso</h2>
          <div className="cd-stats-summary">
            <div><strong>Estudiantes:</strong> {stats.summary.students}</div>
            <div><strong>Promedio avance:</strong> {stats.summary.avgPercent}%</div>
            <div><strong>Completado 100%:</strong> {stats.summary.completedAll}</div>
          </div>
          <div className="cd-table-wrap">
            <table className="cd-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Email</th>
                  <th>Completado</th>
                  <th>Avance</th>
                  <th>Último acceso</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r) => (
                  <tr key={r.studentId}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.completed}/{r.total}</td>
                    <td>{r.percent}%</td>
                    <td>{r.lastAccessAt ? new Date(r.lastAccessAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
