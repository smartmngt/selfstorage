// 열려라창고 반포점 - 서비스워커 v2
// PWA 설치 조건(installability) 충족 + 오프라인 대비 캐싱
// v2: 페이지 진입 시 HTTP 캐시 우회(항상 최신 index.html), SKIP_WAITING 메시지 처리, 구캐시 정리
const CACHE_NAME = 'wh-app-cache-v2';
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

// 페이지에서 새 버전 즉시 적용 요청 시
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// 네트워크 우선, 실패하면 캐시(오프라인 대비)
// 앱 진입(navigate) 요청은 브라우저 HTTP 캐시까지 우회해서 항상 최신 파일을 받음
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isNavigate = event.request.mode === 'navigate';
  const req = isNavigate
    ? new Request(event.request.url, { cache: 'no-cache' })
    : event.request;
  event.respondWith(
    fetch(req)
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
