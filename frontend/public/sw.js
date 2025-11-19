// public/sw.js - VERSIÓN MEJORADA
const STATIC_CACHE = 'static-v4';
const FILES_CACHE = 'edu-files-v1';

self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔥 Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== FILES_CACHE) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  console.log('🔍 Service Worker interceptando:', url.pathname);

  // 🔥 ESTRATEGIA MEJORADA PARA RUTAS DE API
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/admin/') ||
      url.pathname.startsWith('/courses/') && !url.pathname.includes('/uploads/')) {
    
    console.log('🌐 Manejando API route:', url.pathname);
    
    event.respondWith(
      fetch(request).catch(error => {
        console.log('❌ Error de red para API, devolviendo error controlado:', url.pathname);
        
        // Para rutas de progreso, devolver un objeto vacío en lugar de error
        if (url.pathname.includes('/progress/me')) {
          return new Response(JSON.stringify({
            progress: 0,
            completedContents: [],
            lastAccess: null
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Para otras APIs, devolver error controlado
        return new Response(JSON.stringify({
          error: 'Connection failed',
          message: 'No se puede conectar al servidor',
          offline: true
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Manejar archivos offline (mantener igual)
  if (url.pathname.startsWith('/offline-files/')) {
    console.log('📁 Sirviendo archivo offline:', url.pathname);
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        return fetch(request);
      })
    );
    return;
  }

  // Manejar uploads para offline (mantener igual)
  if (url.pathname.startsWith('/uploads/')) {
    console.log('📤 Manejando upload:', url.pathname);
    event.respondWith(
      caches.open(FILES_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            console.log('✅ Sirviendo upload desde cache:', url.pathname);
            return response;
          }
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
              console.log('💾 Upload guardado en cache:', url.pathname);
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Para archivos de la API de cursos (descargas) - ESTRATEGIA MEJORADA
  if (url.pathname.startsWith('/api/courses/files/') && url.pathname.includes('/download')) {
    console.log('📥 Manejando descarga:', url.pathname);
    event.respondWith(
      caches.open(FILES_CACHE).then(cache => {
        return cache.match(request).then(response => {
          // Intentar con network primero para archivos frescos
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
              console.log('💾 Descarga guardada en cache:', url.pathname);
            }
            return networkResponse;
          }).catch(error => {
            console.log('❌ Error en descarga, usando cache si existe:', url.pathname);
            // Fallback a cache si no hay conexión
            if (response) {
              console.log('📂 Usando cache para descarga (offline):', url.pathname);
              return response;
            }
            // Si no hay cache, devolver error controlado
            return new Response('Archivo no disponible offline', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        });
      })
    );
    return;
  }

  // Estrategia network-first para recursos estáticos
  console.log('🌐 Network-first para:', url.pathname);
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then(response => {
        return response || new Response('Contenido no disponible offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Sincronización en background (mantener igual)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronización en background');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'BACKGROUND_SYNC' });
  });
}