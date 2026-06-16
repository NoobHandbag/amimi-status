// Service worker: riceve le notifiche push e le mostra come notifiche del
// telefono, anche con la pagina/Chrome chiusi.

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'Amimì', body: event.data ? event.data.text() : '' }; }

  var title = data.title || 'Amimì — Stato';
  var options = {
    body: data.body || '',
    tag: 'amimi-status',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || 'https://noobhandbag.github.io/amimi-status/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) ||
            'https://noobhandbag.github.io/amimi-status/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (wins) {
      for (var i = 0; i < wins.length; i++) {
        if (wins[i].url.indexOf('amimi-status') >= 0 && 'focus' in wins[i]) return wins[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
