import { reactive } from 'vue';

export const notificationStore = reactive({
  notifications: [],
  isInitialized: false
});

export function createNotificationSystem() {
  if (notificationStore.isInitialized) return;
  notificationStore.isInitialized = true;
}

export function useNotification() {
  if (!notificationStore.isInitialized) {
    throw new Error('Notification system not found. Did you call createNotificationSystem?');
  }

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    notificationStore.notifications.push({
      id,
      message,
      type,
      timestamp: new Date()
    });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    const index = notificationStore.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      notificationStore.notifications.splice(index, 1);
    }
  };

  return {
    notifications: notificationStore.notifications,
    showNotification,
    removeNotification
  };
}
