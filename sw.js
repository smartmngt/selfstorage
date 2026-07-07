// 열려라창고 반포점 - 서비스워커
// PWA 설치 조건(installability)을 충족시키기 위한 최소 구성
// + 정적 파일 캐싱으로 오프라인에서도 앱이 열리도록 함
const CACHE_NAME = 'wh-app-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패하면 캐시(오프라인 대비)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── 관리자 전용: 새 매출 감지 푸시 알림 수신 ──
self.addEventListener('push', function(event) {
  let data = { title: '📦 새 매출 감지', body: '' };
  try { data = event.data.json(); } catch (e) { data.body = event.data ? event.data.text() : ''; }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
