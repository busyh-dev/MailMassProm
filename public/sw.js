self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notifica', {
        body: data.body || '',
        icon: data.icon || '/icon.png',
        badge: '/icon.png',
        vibrate: [200, 100, 200],
      })
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/')
    );
  });