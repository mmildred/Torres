import React, { useState, useEffect } from "react";
import downloadManager from "../offline/downloadManager";
import "./CourseContents.css";

export default function CourseContents({
  course,
  userRole,
  isEnrolled,
  isInstructor,
  onContentUpdated
}) {
  const [downloadedFiles, setDownloadedFiles] = useState({});
  const [downloading, setDownloading] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  // ✅ URL BASE DEL BACKEND
  const BACKEND_URL = 'http://localhost:4000';

  // ✅ OBTENER TOKEN DESDE LOCALSTORAGE
  const getToken = () => {
    return localStorage.getItem('token') || '';
  };

  useEffect(() => {
    const initializeDownloads = async () => {
      // Limpiar archivos corruptos al cargar el componente
      const cleanedCount = await downloadManager.cleanupCorruptedFiles();
      if (cleanedCount > 0) {
        console.log(`✅ Limpiados ${cleanedCount} archivos corruptos`);
      }
      
      loadDownloadedFiles();
    };

    initializeDownloads();

    const handleDownloadComplete = (event) => {
      const { file, isIncomplete, message } = event.detail;

      setDownloadedFiles(prev => ({
        ...prev,
        [file.fileId]: true
      }));
      setDownloading(prev => ({
        ...prev,
        [file.fileId]: false
      }));

      if (isIncomplete) {
        alert(`⚠️ ${message}\n\nPuedes intentar abrirlo, pero es posible que no funcione correctamente.`);
      }
    };

    window.addEventListener('downloadComplete', handleDownloadComplete);

    return () => {
      window.removeEventListener('downloadComplete', handleDownloadComplete);
    };
  }, []);

  const loadDownloadedFiles = async () => {
    try {
      const downloaded = await downloadManager.getDownloadedFiles();
      const downloadedMap = {};
      downloaded.forEach(file => {
        downloadedMap[file.fileId] = true;
      });
      setDownloadedFiles(downloadedMap);
    } catch (error) {
      console.error('Error cargando archivos descargados:', error);
    }
  };

  // ✅ FUNCIÓN CORREGIDA PARA ABRIR ONLINE CON TOKEN
 const handleOpenOnline = (content) => {
  const token = getToken();
  if (!token) {
    alert('❌ No estás autenticado. Inicia sesión nuevamente.');
    return;
  }

  // ✅ Enviar token como query parameter
  const onlineUrl = `${BACKEND_URL}/courses/files/${content._id}/download?token=${encodeURIComponent(token)}`;
  
  console.log('🌐 Abriendo archivo online:', onlineUrl);
  window.open(onlineUrl, '_blank');
};

  // ✅ FUNCIÓN ALTERNATIVA: Descargar primero y luego abrir
  const handleOpenOnlineAlternative = async (content) => {  
    try {
      const token = getToken();
      if (!token) {
        alert('❌ No estás autenticado. Inicia sesión nuevamente.');
        return;
      }

      console.log('📥 Descargando archivo para abrir online...');
      
      const response = await fetch(`${BACKEND_URL}/courses/files/${content._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      console.log('🔗 Abriendo blob URL:', url);
      window.open(url, '_blank');
      
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      
    } catch (error) {
      console.error('❌ Error abriendo archivo online:', error);
      alert(`Error al abrir el archivo: ${error.message}`);
    }
  };

  // ✅ FUNCIÓN CORREGIDA PARA DESCARGA
  const handleDownload = async (content) => {
    if (!content.filePath) return;

    setDownloading(prev => ({ ...prev, [content._id]: true }));

    try {
      // ✅ PRIMERO ELIMINAR CUALQUIER VERSIÓN CORRUPTA EXISTENTE
      if (downloadedFiles[content._id]) {
        await downloadManager.deleteDownloadedFile(content._id);
        setDownloadedFiles(prev => ({
          ...prev,
          [content._id]: false
        }));
      }

      const fileData = {
        _id: content._id,
        fileId: content._id,
        title: content.title,
        fileType: content.type || 'document',
        fileSize: content.fileSize || 0,
        filePath: content.filePath,
        fileName: content.fileName || content.title,
        courseId: course._id,
        courseTitle: course.title
      };

      // ✅ USAR URL ABSOLUTA DEL BACKEND
      const downloadUrl = `${BACKEND_URL}/courses/files/${content._id}/download`;

      console.log("📥 Iniciando descarga desde:", downloadUrl);

      const success = await downloadManager.downloadFile(fileData, downloadUrl);

      if (success) {
        setDownloadedFiles(prev => ({
          ...prev,
          [content._id]: true
        }));
        
        setTimeout(() => {
          alert(`✅ "${content.title}" descargado correctamente para uso offline.`);
        }, 500);
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);

      let errorMessage = `Error descargando "${content.title}": ${error.message}`;

      if (error.message.includes('HTML')) {
        errorMessage += '\n\n🔧 El servidor está devolviendo HTML en lugar del archivo. Contacta al administrador.';
      } else if (error.message.includes('incompleto')) {
        errorMessage += '\n\nEl archivo se descargó pero puede estar incompleto. Puedes intentar abrirlo de todos modos.';
      } else if (error.message.includes('servidor')) {
        errorMessage += '\n\nProblema del servidor. Intenta más tarde.';
      } else if (error.message.includes('CORS')) {
        errorMessage += '\n\nError de CORS. Verifica que el backend permita requests desde el frontend.';
      }

      alert(errorMessage);
      
      // ✅ SI FALLA LA DESCARGA, OFRECER ABRIR ONLINE
      if (window.confirm('¿Quieres abrir el archivo en línea?')) {
        handleOpenOnline(content);
      }
    } finally {
      setDownloading(prev => ({
        ...prev,
        [content._id]: false
      }));
    }
  };

  const handleOpenOffline = async (content) => {
    try {
      console.log('🔄 Intentando abrir archivo offline:', content._id);

      const status = await downloadManager.verifyFileDownload(content._id);
      console.log('📊 Estado del archivo:', status);

      // ✅ DETECTAR SI EL ARCHIVO ESTÁ CORRUPTO
      if (status.exists && status.metadata && status.metadata.fileSize < 1000) {
        console.warn('⚠️ Archivo corrupto detectado, eliminando...');
        
        // Eliminar archivo corrupto
        await downloadManager.deleteDownloadedFile(content._id);
        
        // Actualizar estado
        setDownloadedFiles(prev => ({
          ...prev,
          [content._id]: false
        }));
        
        // Ofrecer abrir online
        if (window.confirm(`El archivo "${content.title}" está corrupto (solo ${status.metadata.fileSize} bytes). ¿Quieres abrirlo en línea?`)) {
          handleOpenOnline(content);
        }
        return;
      }

      if (!status.exists) {
        // Si no existe offline, abrir online
        handleOpenOnline(content);
        return;
      }

      // Si existe y no está corrupto, intentar abrir offline
      await downloadManager.openFileWithRepair(content._id);

    } catch (error) {
      console.error('❌ Error abriendo archivo offline:', error);
      
      // ✅ FALLBACK A ONLINE SI FALLA EL OFFLINE
      if (window.confirm(`Error al abrir offline: ${error.message}. ¿Quieres abrirlo en línea?`)) {
        handleOpenOnline(content);
      }
    }
  };

  // ✅ FUNCIÓN DE DEBUG TEMPORAL
  const handleDebugCleanup = async () => {
    try {
      const count = await downloadManager.cleanupCorruptedFiles();
      alert(`✅ Limpiados ${count} archivos corruptos`);
      
      // Recargar lista
      await loadDownloadedFiles();
    } catch (error) {
      console.error('Error en limpieza:', error);
      alert('Error al limpiar archivos');
    }
  };

  // ✅ VERIFICAR TOKEN
  const checkToken = () => {
    const token = getToken();
    console.log('🔐 Token actual:', token ? 'PRESENTE' : 'AUSENTE');
    alert(token ? '✅ Token presente' : '❌ Token ausente - Reinicia sesión');
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: '📕',
      video: '🎬',
      image: '🖼️',
      document: '📄',
      presentation: '📊',
      texto: '📝',
      tarea: '📋',
      quiz: '❓'
    };
    return icons[fileType] || '📁';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const visibleContents = isInstructor
    ? course.contents || []
    : (course.contents || []).filter(content => content.isPublished === true);

  if (!visibleContents || visibleContents.length === 0) {
    return (
      <div className="course-contents">
        <div className="contents-header">
          <h2>Contenido del Curso</h2>
        </div>
        <div className="empty-contents">
          <div className="empty-icon">📚</div>
          <h3>No hay contenidos disponibles</h3>
          <p>
            {isInstructor
              ? "Comienza agregando contenido a tu curso."
              : "Este curso no tiene contenidos publicados aún."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-contents">
      <div className="contents-header">
        <h2>Contenido del Curso</h2>
        <span className="contents-count">
          {visibleContents.length} lección{visibleContents.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* ✅ BOTÓN DE DEBUG TEMPORAL */}
      {isInstructor && (
        <div style={{marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px'}}>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="btn btn-warning"
            style={{fontSize: '12px', padding: '5px 10px'}}
          >
            🛠️ Debug
          </button>
          
          {showDebug && (
            <div style={{marginTop: '10px'}}>
              <button 
                onClick={handleDebugCleanup}
                className="btn btn-danger"
                style={{fontSize: '12px', padding: '5px 10px', marginRight: '10px'}}
              >
                🧹 Limpiar Corruptos
              </button>
              <button 
                onClick={checkToken}
                className="btn btn-info"
                style={{fontSize: '12px', padding: '5px 10px', marginRight: '10px'}}
              >
                🔐 Verificar Token
              </button>
              <button 
                onClick={() => {
                  downloadManager.getDownloadedFiles().then(files => {
                    console.log('📋 Archivos descargados:', files);
                    alert(`Tienes ${files.length} archivos descargados. Revisa la consola.`);
                  });
                }}
                className="btn btn-info"
                style={{fontSize: '12px', padding: '5px 10px'}}
              >
                📊 Ver Estado
              </button>
              <span style={{marginLeft: '10px', fontSize: '12px', color: '#666'}}>
                Backend: {BACKEND_URL}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="contents-list">
        {visibleContents.map((content, index) => {
          const hasFile = !!content.filePath;
          const isDownloaded = downloadedFiles[content._id];
          const isDownloading = downloading[content._id];

          return (
            <div key={content._id} className="content-item">
              <div className="content-number">{index + 1}</div>

              <div className="content-info">
                <div className="content-header">
                  <h4>{content.title}</h4>
                  {!content.isPublished && isInstructor && (
                    <span className="draft-badge">Borrador</span>
                  )}
                </div>

                {content.description && (
                  <p className="content-description">{content.description}</p>
                )}

                <div className="content-meta">
                  {content.type && (
                    <span className="content-type">{content.type}</span>
                  )}
                  {content.duration > 0 && (
                    <span className="content-duration">⏱️ {content.duration} min</span>
                  )}
                  {hasFile && content.fileSize > 0 && (
                    <span className="content-size">{formatFileSize(content.fileSize)}</span>
                  )}
                </div>

                {/* Acciones de archivo */}
                {hasFile && (
                  <div className="content-actions">
                    {isDownloaded ? (
                      <div className="offline-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleOpenOffline(content)}
                          title="Abrir sin conexión a internet"
                        >
                          🌐 Abrir Online
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleOpenOnline(content)}
                          title="Abrir versión en línea (siempre actualizada)"
                        >
                          Abrir Offline
                        </button>
                        <span className="offline-badge">✅ Disponible sin internet</span>
                      </div>
                    ) : (
                      <div className="online-actions">
                        <button
                          className={`btn btn-primary ${isDownloading ? 'downloading' : ''}`}
                          onClick={() => handleDownload(content)}
                          disabled={isDownloading || !isEnrolled}
                          title={!isEnrolled ? "Inscríbete para descargar" : "Descargar para uso offline"}
                        >
                          {isDownloading ? (
                            <>
                              <span className="loading-spinner-small"></span>
                              Descargando...
                            </>
                          ) : (
                            `📥 Descargar ${getFileIcon(content.type)}`
                          )}
                        </button>
                        
                        <button
                          className="btn btn-outline"
                          onClick={() => handleOpenOnline(content)}
                          disabled={!isEnrolled}
                          title="Abrir en línea"
                        >
                          🔗 Abrir Online
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!hasFile && (
                  <div className="no-file-message">
                    <span>📝 Contenido sin archivo adjunto</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}