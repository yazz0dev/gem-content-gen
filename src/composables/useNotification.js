import { ref, provide, inject } from 'vue';

const NOTIFICATION_KEY = Symbol();

export function createNotificationSystem() {
  const notification = ref(null);
  const timeout = ref(null);

  function showNotification(message, type = 'info', duration = 5000) {
    if (timeout.value) clearTimeout(timeout.value);
    
    notification.value = { message, type };
    
    timeout.value = setTimeout(() => {
      notification.value = null;
    }, duration);
  }

  provide(NOTIFICATION_KEY, {
    notification,
    showNotification
  });
}

export function useNotification() {
  const notificationSystem = inject(NOTIFICATION_KEY);
  
  if (!notificationSystem) {
    throw new Error('Notification system not found. Did you call createNotificationSystem?');
  }
  
  return notificationSystem;
}
