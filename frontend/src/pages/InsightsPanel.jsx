import React from "react";
import "./InsightsPanel.css";

const InsightsPanel = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="insights-section">
        <h2>🧠 Insights Inteligentes</h2>
        <div className="empty-state">
          <p>🤖 Los insights aparecerán cuando haya suficientes datos para analizar</p>
          <small>Necesitas al menos 3 estudiantes activos para generar insights</small>
        </div>
      </div>
    );
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      prediction: '🔮',
      risk: '🚨',
      achievement: '🏆',
      recommendation: '💡',
      segmentation: '🎯',
      opportunity: '💪',
      pace: '⚡',
      'content-risk': '⚠️'
    };
    return icons[type] || '📊';
  };

  return (
    <div className="insights-section">
      <div className="insights-header">
        <h2>🧠 Insights Inteligentes</h2>
        <span className="insights-count">{insights.length} insight(s) generado(s)</span>
      </div>
      
      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`insight-card insight-${insight.type} ${insight.priority || 'normal'}`}
          >
            <div className="insight-header">
              <div className="insight-title">
                <span className="insight-type-icon">
                  {getTypeIcon(insight.type)}
                </span>
                <h3>{insight.title}</h3>
              </div>
              <div className="insight-meta">
                {insight.priority && (
                  <span className="priority-indicator">
                    {getPriorityIcon(insight.priority)}
                  </span>
                )}
                <span className="insight-badge">{insight.type}</span>
              </div>
            </div>

            <p className="insight-message">{insight.message}</p>

            {/* Información adicional específica por tipo */}
            {insight.predictedValue && (
              <div className="insight-metric">
                <strong>Valor proyectado:</strong> {insight.predictedValue}%
              </div>
            )}

            {insight.confidence && (
              <div className="insight-metric">
                <strong>Confianza:</strong> {Math.round(insight.confidence)}%
              </div>
            )}

            {insight.benchmark && (
              <div className="insight-metric">
                <strong>Benchmark industria:</strong> {insight.benchmark}%
              </div>
            )}

            {insight.averageProgress && (
              <div className="insight-metric">
                <strong>Progreso promedio:</strong> {insight.averageProgress}%
              </div>
            )}

            {/* Estudiantes involucrados */}
            {insight.students && insight.students.length > 0 && (
              <div className="insight-students">
                <strong>Estudiantes involucrados:</strong>
                <div className="students-list">
                  {insight.students.map((student, idx) => (
                    <span key={idx} className="student-tag">
                      {typeof student === 'string' ? student : student.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones recomendadas */}
            {insight.actions && insight.actions.length > 0 && (
              <div className="insight-actions">
                <strong>Acciones recomendadas:</strong>
                <ul>
                  {insight.actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Segmentación */}
            {insight.segments && (
              <div className="insight-segments">
                <strong>Distribución:</strong>
                <div className="segments-grid">
                  {Object.entries(insight.segments).map(([segment, count]) => (
                    <div key={segment} className="segment-item">
                      <span className="segment-name">{segment}:</span>
                      <span className="segment-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;