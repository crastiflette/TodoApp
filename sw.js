// Service worker : met l'application en cache pour qu'elle fonctionne hors ligne.
// Pense à incrémenter CACHE_VERSION à chaque mise à jour des fichiers.
const CACHE_VERSION = 'todo-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './vendor/Sortable.min.js',
    './manifest.webmanifest',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

// Réseau d'abord (pour avoir la dernière version), cache en secours hors ligne
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response.ok) return response;
                const copy = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
});
