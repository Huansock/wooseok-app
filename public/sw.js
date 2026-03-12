self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {}
    event.waitUntil(
        self.registration.showNotification(data.title ?? 'New notification', {
            body: data.body ?? '',
            icon: '/assets/images/icon.png',
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(clients.openWindow('/'))
})
