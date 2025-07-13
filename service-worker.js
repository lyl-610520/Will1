self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('garden-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js',
        '/manifest.json',
        '/service-worker.js',
        '/assets/sunflower.svg',
        '/assets/lavender.svg',
        '/assets/rose.svg',
        '/assets/pet-cat.svg',
        '/assets/pet-cat-hat.svg',
        '/assets/stars.png',
        '/assets/icon.png',
        '/assets/opening-animation.json',
        '/assets/sound-wind.mp3'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'assets/icon.png'
  });
});
