// Service Worker with icons in cache
const CACHE_NAME = 'todo-cache-v5';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting()) // 새 서비스 워커가 대기 없이 즉시 설치되도록 강제
    );
});

self.addEventListener('fetch', (event) => {
    // HTML 페이지 등은 항상 네트워크를 먼저 확인하여 최신 버전인지 체크 (Network First)
    // 오프라인이거나 에러가 났을 때만 캐시를 사용
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Activate event to clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim() // 새 서비스 워커가 제어권을 즉각 획득하도록 강제
        ])
    );
});
