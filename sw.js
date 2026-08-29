// sw.js - Service Worker for Spy Station
const CACHE_NAME = 'spy-station-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://i.imgur.com/8mYpR2N.png',
    'https://i.imgur.com/4xVq3wQ.png',
    'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});