import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import downloadManager from '../offline/downloadManager';
import './ResourceLibrary.css';

export default function ResourceLibrary() {
  const [files, setFiles] = useState([]);
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [activeTab, setActiveTab] = useState('available');
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableFiles();
    loadDownloadedFiles();
    
    const handleDownloadComplete = (event) => {
      const { file } = event.detail;
      console.log('✅ Descarga completada:', file.title);
      loadDownloadedFiles();
    };

    const handleDownloadError = (event) => {
      const { file, error } = event.detail;
      console.error('❌ Error en descarga:', error);
      alert(`Error descargando ${file.title}: ${error}`);
    };

    window.addEventListener('downloadComplete', handleDownloadComplete);
    window.addEventListener('downloadError', handleDownloadError);

    return () => {
      window.removeEventListener('downloadComplete', handleDownloadComplete);
      window.removeEventListener('downloadError', handleDownloadError);
    };
  }, []);

  const loadAvailableFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/courses/files/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar archivos disponibles');
      }
      
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      alert('Error al cargar archivos disponibles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDownloadedFiles = async () => {
    try {
      const downloaded = await downloadManager.getDownloadedFiles();
      setDownloadedFiles(downloaded);
    } catch (error) {
      console.error('Error cargando archivos descargados:', error);
    }
  };

  const handleDownload = async (file) => {
    setDownloading(prev => ({ ...prev, [file._id]: true }));
    
    const success = await downloadManager.downloadFile(file);
    
    setDownloading(prev => ({ ...prev, [file._id]: false }));
    
    if (success) {
      await loadDownloadedFiles();
    }
  };

  const handleOpenOffline = async (file) => {
    try {
      await downloadManager.openFile(file.fileId);
    } catch (error) {
      alert('Error abriendo archivo offline: ' + error.message);
    }
  };

  const handleDeleteOffline = async (file) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${file.title}" del almacenamiento offline?`)) {
      const success = await downloadManager.deleteDownloadedFile(file.fileId);
      if (success) {
        await loadDownloadedFiles();
        alert('Archivo eliminado del almacenamiento offline');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileTypeColor = (fileType) => {
    const colors = {
      pdf: '#ff6b6b',
      video: '#4ecdc4',
      image: '#45b7d1',
      document: '#96ceb4',
      presentation: '#feca57',
      texto: '#ff9ff3',
      tarea: '#54a0ff',
      quiz: '#5f27cd'
    };
    return colors[fileType] || '#8395a7';
  };

  if (loading) {
    return (
      <div className="resource-library">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando recursos educativos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-library">
      {/* Header */}
      <div className="resource-header">
        <h1>📚 Biblioteca de Recursos</h1>
        <p>Descarga recursos educativos para acceder sin conexión a internet</p>
        
        <div className="storage-info">
          <span>📦 Archivos offline: {downloadedFiles.length}</span>
          <span>💾 Espacio usado: {
            downloadedFiles.reduce((total, file) => total + (file.fileSize || 0), 0) / (1024 * 1024) > 1 
              ? (downloadedFiles.reduce((total, file) => total + (file.fileSize || 0), 0) / (1024 * 1024)).toFixed(2) + ' MB'
              : (downloadedFiles.reduce((total, file) => total + (file.fileSize || 0), 0) / 1024).toFixed(2) + ' KB'
          }</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            📥 Disponibles ({files.length})
          </button>
          <button 
            className={`tab ${activeTab === 'downloaded' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloaded')}
          >
            📱 Offline ({downloadedFiles.length})
          </button>
        </div>
      </div>

      {/* Contenido de las Tabs */}
      <div className="tab-content">
        {activeTab === 'available' && (
          <div className="files-section">
            <h2>Recursos Disponibles para Descarga</h2>
            {files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No hay archivos disponibles</h3>
                <p>Inscríbete en cursos para acceder a recursos educativos.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/courses')}
                >
                  Explorar Cursos
                </button>
              </div>
            ) : (
              <div className="files-grid">
                {files.map(file => {
                  const isDownloaded = downloadedFiles.some(df => df.fileId === file._id);
                  const isDownloading = downloading[file._id];

                  return (
                    <div key={file._id} className="file-card">
                      <div 
                        className="file-type-badge"
                        style={{ backgroundColor: getFileTypeColor(file.fileType) }}
                      >
                        {getFileIcon(file.fileType)}
                      </div>
                      
                      <div className="file-info">
                        <h3>{file.title}</h3>
                        <p className="file-course">{file.courseTitle}</p>
                        <p className="file-meta">
                          {file.subject} • {file.educationalLevel}
                        </p>
                        <p className="file-size">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>

                      <div className="file-actions">
                        {isDownloaded ? (
                          <div className="downloaded-actions">
                            <button 
                              className="btn btn-success"
                              onClick={() => handleOpenOffline(file)}
                            >
                              📖 Abrir
                            </button>
                            <button 
                              className="btn btn-outline delete-btn"
                              onClick={() => handleDeleteOffline(file)}
                              title="Eliminar del almacenamiento offline"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <button 
                            className={`btn btn-primary ${isDownloading ? 'downloading' : ''}`}
                            onClick={() => handleDownload(file)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                Descargando...
                              </>
                            ) : (
                              '📥 Descargar'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloaded' && (
          <div className="files-section">
            <h2>Tus Archivos Offline</h2>
            {downloadedFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📱</div>
                <h3>No tienes archivos offline</h3>
                <p>Descarga recursos desde la pestaña "Disponibles" para acceder sin internet.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('available')}
                >
                  Ver Recursos Disponibles
                </button>
              </div>
            ) : (
              <div className="offline-files-grid">
                {downloadedFiles.map(file => (
                  <div key={file.fileId} className="offline-file-card">
                    <div className="offline-file-header">
                      <div 
                        className="file-type-badge"
                        style={{ backgroundColor: getFileTypeColor(file.fileType) }}
                      >
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="offline-file-info">
                        <h4>{file.title}</h4>
                        <p className="file-course">{file.courseTitle}</p>
                        <p className="file-meta">
                          Descargado: {new Date(file.downloadedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="file-size">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="offline-file-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => handleOpenOffline(file)}
                      >
                        📖 Abrir
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleDeleteOffline(file)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}