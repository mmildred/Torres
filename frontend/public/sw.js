// public/sw.js - VERSIÓN CORREGIDA
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

  // 🔥 NO INTERCEPTAR rutas de API, auth, courses, admin
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/admin/') ||
      url.pathname.startsWith('/courses/') && !url.pathname.includes('/uploads/')) {
    console.log('🚫 Pasando al network (API route):', url.pathname);
    // Dejar que estas peticiones pasen directamente al network
    return;
  }

  // Manejar archivos offline
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

  // Manejar uploads para offline (solo archivos estáticos)
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
            // Cachear solo si es exitoso
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

  // Para archivos de la API de cursos (descargas)
if (url.pathname.startsWith('/api/courses/files/') && url.pathname.includes('/download')) {
  console.log('📥 Manejando descarga:', url.pathname);
  event.respondWith(
    caches.open(FILES_CACHE).then(cache => {
      return cache.match(request).then(response => {
        // Network-first con mejor manejo de errores
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok && networkResponse.status === 200) {
            // Verificar que el contenido sea válido
            return networkResponse.clone().text().then(text => {
              if (text.length < 100) {
                console.warn('⚠️ Respuesta muy pequeña, puede ser error:', text);
              }
              cache.put(request, networkResponse.clone());
              return networkResponse;
            }).catch(() => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback a cache si no hay conexión
          if (response) {
            console.log('📂 Usando cache para descarga (offline):', url.pathname);
            return response;
          }
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

// Sincronización en background
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