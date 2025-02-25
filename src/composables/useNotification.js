// src/composables/useNotifications.js (Singular file)
import { reactive, readonly } from 'vue';

const state = reactive({
  notifications: [],
});

let nextId = 1;

function showNotification(message, type = 'info', duration = 5000) {
  const id = nextId++;
  state.notifications.push({
    id,
    message,
    type,
  });

  setTimeout(() => {
    removeNotification(id);
  }, duration);
}

function removeNotification(id) {
  const index = state.notifications.findIndex((n) => n.id === id);
  if (index > -1) {
    state.notifications.splice(index, 1);
  }
}

export function useNotifications() {
  return {
    notifications: readonly(state.notifications), // Readonly to prevent direct modification
    showNotification,
    removeNotification,
  };
}