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

  useEffect(() => {
    loadDownloadedFiles();
    
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

  const handleDownload = async (content) => {
    if (!content.filePath) return;
    
    setDownloading(prev => ({ ...prev, [content._id]: true }));
    
    try {
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

      const success = await downloadManager.downloadFile(fileData);
      
      if (success) {
        setDownloadedFiles(prev => ({
          ...prev,
          [content._id]: true
        }));
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);
      
      let errorMessage = `Error descargando "${content.title}": ${error.message}`;
      
      if (error.message.includes('incompleto')) {
        errorMessage += '\n\nPosibles soluciones:\n• Verifica tu conexión a internet\n• El archivo puede estar corrupto en el servidor\n• Intenta descargarlo más tarde';
      } else if (error.message.includes('servidor')) {
        errorMessage += '\n\nProblema del servidor. Contacta al administrador.';
      }
      
      alert(errorMessage);
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
      
      if (!status.exists) {
        alert('El archivo no está disponible offline. Intenta descargarlo nuevamente.');
        return;
      }
      
      if (status.metadata && status.cacheUrl) {
        const cache = await caches.open('edu-files-v1');
        const response = await cache.match(status.cacheUrl);
        if (response) {
          const blob = await response.blob();
          if (blob.size < 1000 && status.metadata.fileSize > 1000) {
            console.warn('⚠️ DISCREPANCIA: Metadata dice', status.metadata.fileSize, 'pero cache tiene', blob.size);
            
            if (window.confirm(`El archivo "${content.title}" parece estar incompleto (${blob.size} bytes de ${status.metadata.fileSize} esperados). ¿Quieres re-descargarlo automáticamente?`)) {
              console.log('🔄 Re-descargando por discrepancia...');
              await handleDownload(content);
              return;
            }
          }
        }
      }
      
      await downloadManager.openFileWithRepair(content._id);
      
    } catch (error) {
      console.error('❌ Error abriendo archivo offline:', error);
      
      let errorMessage = `Error abriendo "${content.title}": ${error.message}`;
      
      if (error.message.includes('bloqueó')) {
        errorMessage += '\n\nSolución: Permite ventanas emergentes para este sitio.';
      } else if (error.message.includes('incompleto') || error.message.includes('discrepancia')) {
        errorMessage += '\n\nEl archivo se descargó incompleto. Se intentará re-descargar automáticamente.';
        
        setTimeout(() => {
          console.log('🔄 Re-descargando archivo automáticamente por error...');
          handleDownload(content);
        }, 1000);
      } else if (error.message.includes('no encontrado') || error.message.includes('corrupto')) {
        errorMessage += '\n\nSe intentará re-descargar automáticamente.';
        
        setTimeout(() => {
          console.log('🔄 Re-descargando archivo automáticamente...');
          handleDownload(content);
        }, 1000);
      }
      
      alert(errorMessage);
    }
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
                          📖 Abrir Offline
                        </button>
                        <span className="offline-badge">✅ Disponible sin internet</span>
                      </div>
                    ) : (
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
                    )}
                    
                    {/* Enlace directo como fallback */}
                    <a 
                      href={`http://localhost:4000/api/courses/uploads/${content.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      onClick={(e) => {
                        if (isDownloaded) {
                          e.preventDefault();
                          handleOpenOffline(content);
                        }
                      }}
                      title="Abrir en línea"
                    >
                      🔗 Abrir Online
                    </a>
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