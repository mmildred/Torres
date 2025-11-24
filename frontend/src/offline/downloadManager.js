class DownloadManager {
  constructor() {
    this.dbName = 'EduPlatformOffline';
    this.storeName = 'downloadedFiles';
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado para descargas offline:', registration);
      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    } else {
      console.log('❌ Service Worker no soportado en este navegador');
    }
    this.db = await this.openDB();
    
    // ✅ LIMPIAR ARCHIVOS CORRUPTOS AL INICIAR
    await this.cleanupCorruptedFiles();
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'fileId' });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          store.createIndex('courseId', 'courseId', { unique: false });
        }
      };
    });
  }

  async downloadFile(file, downloadUrl = null) {
    try {
      console.log('📥 Iniciando descarga offline:', file.title);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      // ✅ URL CORRECTA - usar la ruta del backend
      const finalUrl = downloadUrl || `/courses/files/${file.fileId || file._id}/download`;
      
      console.log('🔍 DEBUG: Verificando respuesta del servidor...');
      console.log('📡 URL final:', finalUrl);
      
      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 DEBUG - Estado respuesta:', response.status, response.statusText);
      console.log('📊 DEBUG - Headers:', Object.fromEntries(response.headers.entries()));
      
      // ✅ VERIFICACIÓN MEJORADA - detectar si es HTML
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/html')) {
        console.warn('⚠️ El servidor devolvió HTML en lugar del archivo');
        
        // Leer como texto para debug
        const htmlContent = await response.text();
        console.log('🔍 Contenido HTML recibido (primeros 200 chars):', htmlContent.substring(0, 200));
        
        throw new Error('El servidor está devolviendo una página HTML en lugar del archivo. Posible error de ruta.');
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // ✅ OBTENER BLOB DIRECTAMENTE
      const blob = await response.blob();
      console.log('📦 Blob obtenido, tamaño:', blob.size, 'bytes');

      // ✅ VERIFICACIÓN MÁS FLEXIBLE
      if (file.fileSize && blob.size < 1000 && file.fileSize > 1000) {
        console.warn('⚠️ Archivo descargado parece incompleto:', blob.size, 'bytes vs esperados:', file.fileSize);
        
        // PERO CONTINUAR CON EL PROCESO
        console.log('🔄 Continuando con el proceso a pesar del tamaño...');
      }

      const cache = await caches.open('edu-files-v1');
      const cacheUrl = `/offline-files/${file.fileId || file._id}-${Date.now()}`;
      
      const saveResponse = new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          'Content-Length': blob.size.toString(),
          'X-Filename': encodeURIComponent(file.fileName || file.title),
          'X-FileId': file.fileId || file._id
        }
      });
      
      await cache.put(cacheUrl, saveResponse);
      console.log('💾 Archivo guardado en cache:', cacheUrl, 'Tamaño:', blob.size, 'bytes');

      // Verificar que se guardó correctamente
      const verifyCache = await cache.match(cacheUrl);
      if (!verifyCache) {
        throw new Error('Error: Archivo no se guardó en cache correctamente');
      }

      const fileMetadata = {
        fileId: file.fileId || file._id,
        title: file.title,
        fileType: file.fileType || file.type || 'document',
        fileSize: blob.size,
        fileName: file.fileName || file.title,
        filePath: file.filePath,
        cacheUrl: cacheUrl,
        downloadedAt: new Date(),
        subject: file.subject,
        educationalLevel: file.educationalLevel,
        courseId: file.courseId,
        courseTitle: file.courseTitle,
        potentiallyIncomplete: (file.fileSize && blob.size < 1000 && file.fileSize > 1000)
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.put(fileMetadata);

      console.log('✅ Archivo descargado para uso offline:', file.title, 'Tamaño:', blob.size, 'bytes');
      
      // Notificar
      if (fileMetadata.potentiallyIncomplete) {
        this.notifyDownloadComplete(file, true);
      } else {
        this.notifyDownloadComplete(file);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      
      // Limpiar archivo corrupto si existe
      try {
        await this.deleteDownloadedFile(file.fileId || file._id);
      } catch (cleanError) {
        console.log('⚠️ No se pudo limpiar archivo corrupto:', cleanError);
      }
      
      this.notifyDownloadError(file, error.message);
      return false;
    }
  }

  // ✅ MÉTODO PARA LIMPIAR ARCHIVOS CORRUPTOS - DENTRO DE LA CLASE
  async cleanupCorruptedFiles() {
    try {
      console.log('🧹 Buscando archivos corruptos...');
      const files = await this.getDownloadedFiles();
      const corruptedFiles = files.filter(file => file.fileSize < 1000);
      
      console.log(`📊 Encontrados ${corruptedFiles.length} archivos potencialmente corruptos`);
      
      for (const file of corruptedFiles) {
        console.log(`🗑️ Eliminando archivo corrupto: ${file.title} (${file.fileSize} bytes)`);
        await this.deleteDownloadedFile(file.fileId);
      }
      
      if (corruptedFiles.length > 0) {
        console.log(`✅ Limpiados ${corruptedFiles.length} archivos corruptos`);
      }
      
      return corruptedFiles.length;
    } catch (error) {
      console.error('❌ Error limpiando archivos corruptos:', error);
      return 0;
    }
  }

  // ... (el resto de tus métodos permanecen igual)
  async getDownloadedFiles() {
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error obteniendo archivos descargados:', error);
      return [];
    }
  }

  async getFile(fileId) {
    try {
      console.log('🔍 Buscando archivo en almacenamiento offline:', fileId);
      
      const files = await this.getDownloadedFiles();
      const fileMeta = files.find(f => f.fileId === fileId);
      
      if (!fileMeta) {
        console.log('❌ Archivo no encontrado en IndexedDB');
        throw new Error('Archivo no encontrado en base de datos local');
      }

      console.log('📋 Metadatos encontrados:', fileMeta);
      
      const cache = await caches.open('edu-files-v1');
      const response = await cache.match(fileMeta.cacheUrl);
      
      if (response) {
        console.log('✅ Archivo encontrado en Cache Storage');
        const blob = await response.blob();
        console.log('📦 Blob obtenido, tamaño:', blob.size, 'bytes');
        
        return {
          blob: blob,
          metadata: fileMeta
        };
      }
      
      console.log('❌ Archivo no encontrado en Cache Storage');
      throw new Error('Archivo no disponible en cache');
    } catch (error) {
      console.error('❌ Error en getFile:', error);
      throw error;
    }
  }

  async openFile(fileId) {
    try {
      console.log('📂 Intentando abrir archivo offline:', fileId);
      
      const fileData = await this.getFile(fileId);
      const blob = fileData.blob;
      const metadata = fileData.metadata;
      
      console.log('📄 Abriendo archivo:', metadata.title, 'Tipo:', metadata.fileType, 'Tamaño:', blob.size, 'bytes');
      
      const url = URL.createObjectURL(blob);
      console.log('🔗 URL del blob creada:', url);
      
      // DETECCIÓN MEJORADA DEL TIPO DE ARCHIVO
      let mimeType = this.getMimeType(metadata.fileType, metadata.fileName);
      console.log('📋 MIME Type detectado:', mimeType);
      
      // Estrategias de apertura MEJORADAS - SIEMPRE intentar abrir
      if (mimeType === 'application/pdf') {
        console.log('📕 Abriendo PDF en nueva ventana/pestaña');
        const pdfWindow = window.open(url, '_blank');
        
        if (!pdfWindow) {
          // Fallback: forzar descarga
          console.log('🔄 Fallback: descargando PDF');
          this.forceDownload(blob, metadata.fileName, mimeType);
        }
      } 
      else if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        console.log('🎬 Abriendo multimedia en nueva ventana');
        window.open(url, '_blank');
      }
      else {
        console.log('📄 Forzando descarga para tipo:', mimeType);
        this.forceDownload(blob, metadata.fileName, mimeType);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error abriendo archivo:', error);
      
      if (error.message.includes('bloqueó')) {
        throw new Error('El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.');
      } else if (error.message.includes('no encontrado')) {
        throw new Error('El archivo no se encuentra en el almacenamiento offline. Intenta descargarlo nuevamente.');
      } else {
        throw new Error(`No se pudo abrir el archivo: ${error.message}`);
      }
    }
  }

  getMimeType(fileType, fileName) {
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
    
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      zip: 'application/zip'
    };
    
    // Priorizar extensión del archivo sobre fileType
    if (extension && mimeTypes[extension]) {
      return mimeTypes[extension];
    }
    
    // Fallback a fileType
    const typeMap = {
      pdf: 'application/pdf',
      image: 'image/jpeg',
      video: 'video/mp4',
      document: 'application/pdf',
      presentation: 'application/vnd.ms-powerpoint',
      texto: 'text/plain'
    };
    
    return typeMap[fileType] || 'application/octet-stream';
  }

  forceDownload(blob, fileName, mimeType) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    // Agregar tipo MIME si es posible
    if (mimeType !== 'application/octet-stream') {
      const newBlob = new Blob([blob], { type: mimeType });
      a.href = URL.createObjectURL(newBlob);
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('🗑️ URL del blob liberada después de descarga forzada');
    }, 1000);
  }

  async verifyFileDownload(fileId) {
    try {
      console.log('🔍 Verificando estado del archivo:', fileId);
      
      const files = await this.getDownloadedFiles();
      const fileMeta = files.find(f => f.fileId === fileId);
      
      if (!fileMeta) {
        console.log('❌ No encontrado en IndexedDB');
        return { exists: false, location: 'none' };
      }
      
      console.log('✅ Encontrado en IndexedDB:', fileMeta);
      
      const cache = await caches.open('edu-files-v1');
      const response = await cache.match(fileMeta.cacheUrl);
      
      if (response) {
        console.log('✅ Encontrado en Cache Storage');
        return { 
          exists: true, 
          location: 'both',
          metadata: fileMeta,
          cacheUrl: fileMeta.cacheUrl
        };
      } else {
        console.log('⚠️ En IndexedDB pero NO en Cache');
        return { 
          exists: false, 
          location: 'indexeddb_only',
          metadata: fileMeta
        };
      }
      
    } catch (error) {
      console.error('❌ Error verificando archivo:', error);
      return { exists: false, location: 'error', error: error.message };
    }
  }

  async isFileDownloaded(fileId) {
    const files = await this.getDownloadedFiles();
    return files.some(file => file.fileId === fileId);
  }

  async deleteDownloadedFile(fileId) {
    try {
      console.log('🗑️ Eliminando archivo del almacenamiento offline:', fileId);
      
      const files = await this.getDownloadedFiles();
      const fileToDelete = files.find(f => f.fileId === fileId);
      
      if (fileToDelete) {
        const cache = await caches.open('edu-files-v1');
        const deleted = await cache.delete(fileToDelete.cacheUrl);
        console.log('🗑️ Eliminado de Cache Storage:', deleted);
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.delete(fileId);

      console.log('✅ Archivo eliminado del almacenamiento offline:', fileId);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
      return false;
    }
  }

  async getOfflineStorageUsage() {
    const files = await this.getDownloadedFiles();
    const totalSize = files.reduce((total, file) => total + (file.fileSize || 0), 0);
    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files: files
    };
  }

  // Notificaciones para la UI
  notifyDownloadComplete(file, isIncomplete = false) {
    const event = new CustomEvent('downloadComplete', {
      detail: { 
        file,
        isIncomplete,
        message: isIncomplete ? 
          `Archivo descargado pero puede estar incompleto (${file.fileSize} bytes esperados)` :
          `Archivo descargado correctamente`
      }
    });
    window.dispatchEvent(event);
    console.log('📢 Evento downloadComplete disparado', isIncomplete ? '(INCOMPLETO)' : '');
  }

  notifyDownloadError(file, error) {
    const event = new CustomEvent('downloadError', {
      detail: { file, error }
    });
    window.dispatchEvent(event);
    console.log('📢 Evento downloadError disparado');
  }

  async cleanupOldFiles(maxAgeDays = 30) {
    const files = await this.getDownloadedFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    const oldFiles = files.filter(file => new Date(file.downloadedAt) < cutoffDate);
    
    for (const file of oldFiles) {
      await this.deleteDownloadedFile(file.fileId);
    }
    
    console.log(`🧹 Limpiados ${oldFiles.length} archivos antiguos`);
    return oldFiles.length;
  }

  // NUEVO MÉTODO: Reparar archivos corruptos
  async repairCorruptedFile(fileId) {
    try {
      console.log('🔧 Reparando archivo posiblemente corrupto:', fileId);
      
      // 1. Eliminar el archivo corrupto del almacenamiento
      await this.deleteDownloadedFile(fileId);
      
      // 2. Buscar en los archivos del curso para re-descargar
      const files = await this.getDownloadedFiles();
      const fileMeta = files.find(f => f.fileId === fileId);
      
      if (fileMeta) {
        console.log('🔄 Re-descargando archivo reparado:', fileMeta.title);
        return await this.downloadFile(fileMeta);
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error reparando archivo:', error);
      return false;
    }
  }

  // NUEVO MÉTODO: Abrir archivo con reparación automática
  async openFileWithRepair(fileId) {
    try {
      console.log('🔄 Abriendo con reparación automática:', fileId);
      
      // Verificar estado primero
      const status = await this.verifyFileDownload(fileId);
      
      if (!status.exists) {
        throw new Error('Archivo no disponible offline');
      }
      
      // Si hay discrepancia de tamaño, reparar automáticamente
      if (status.metadata && status.cacheUrl) {
        const cache = await caches.open('edu-files-v1');
        const response = await cache.match(status.cacheUrl);
        
        if (response) {
          const blob = await response.blob();
          console.log('📊 Verificación tamaño - Cache:', blob.size, 'Metadata:', status.metadata.fileSize);
          
          // Si hay gran discrepancia, reparar
          if (blob.size < 1000 && status.metadata.fileSize > 1000) {
            console.log('🔧 Discrepancia detectada, reparando automáticamente...');
            const repaired = await this.repairCorruptedFile(fileId);
            if (repaired) {
              console.log('✅ Reparado, intentando abrir nuevamente...');
              return await this.openFile(fileId);
            }
          }
        }
      }
      
      // Si no hay discrepancia o no se pudo reparar, abrir normalmente
      return await this.openFile(fileId);
      
    } catch (error) {
      console.error('❌ Error en openFileWithRepair:', error);
      
      // Intentar reparación de emergencia
      try {
        console.log('🚨 Reparación de emergencia...');
        const repaired = await this.repairCorruptedFile(fileId);
        if (repaired) {
          return await this.openFile(fileId);
        }
      } catch (repairError) {
        console.error('❌ Reparación de emergencia falló:', repairError);
      }
      
      throw error;
    }
  }
}

const downloadManager = new DownloadManager();
export default downloadManager;