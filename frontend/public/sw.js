const STATIC_CACHE = 'static-v4';
const FILES_CACHE = 'edu-files-v1';

// Solo mostrar logs detallados en desarrollo (localhost)
const IS_DEV = self.location.hostname === 'localhost';

self.addEventListener('install', (event) => {
  if (IS_DEV) console.log('🛠️ Service Worker instalando...');
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

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ✅ NUEVO: EXCLUIR IMÁGENES Y ARCHIVOS DE AVATAR
  if (url.pathname.includes('/uploads/avatars/') || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    // ⚠️ NO INTERCEPTAR IMÁGENES - dejar que pasen directamente
    if (IS_DEV) console.log('🖼️ Imagen detectada, pasando directamente:', url.pathname);
    return;
  }

  // ✅ NUEVO: EXCLUIR ENDPOINTS CRÍTICOS DE AUTENTICACIÓN
  if (url.pathname.includes('/auth/profile/me') || 
      url.pathname.includes('/auth/') && request.method === 'GET') {
    if (IS_DEV) console.log('🔐 Endpoint de auth detectado, pasando directamente');
    return;
  }

  // 🔥 ESTRATEGIA PARA RUTAS DE API
  const isApiRoute =
    url.pathname.startsWith('/api/') ||
    (url.pathname.startsWith('/courses/') && !url.pathname.includes('/uploads/'));

  if (isApiRoute) {
    event.respondWith(
      fetch(request).catch(error => {
        if (IS_DEV) console.error('❌ Error de red para API:', url.pathname);

        // Fallback específico para progreso
        if (url.pathname.includes('/progress/me')) {
          return new Response(JSON.stringify({
            enrolled: false,
            progress: 0,
            completedContents: 0,
            totalContents: 0
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Fallback genérico
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

  // Resto igual:
  if (url.pathname.startsWith('/offline-files/')) {
    event.respondWith(
      caches.match(request).then(response => response || fetch(request))
    );
    return;
  }

  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.open(FILES_CACHE).then(cache =>
        cache.match(request).then(response => {
          if (response) return response;
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  if (url.pathname.startsWith('/api/courses/files/') && url.pathname.includes('/download')) {
    event.respondWith(
      caches.open(FILES_CACHE).then(cache =>
        cache.match(request).then(response => {
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            if (response) return response;
            return new Response('Archivo no disponible offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then(response =>
        response || new Response('Contenido no disponible offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        })
      )
    )
  );
});


// Sincronización en background (igual que antes)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    if (IS_DEV) console.log('🔄 Sincronización en background');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'BACKGROUND_SYNC' });
  });
}
