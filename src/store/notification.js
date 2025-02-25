// src/store/notification.js
//Corrected
import { reactive, readonly } from 'vue';

const state = reactive({
    notifications: [],
    nextId: 1
});


// Export a function to access the state
export function useNotificationStore() {
  return {
        notifications: readonly(state.notifications), // Make notifications array readonly
        addNotification,
        removeNotification
    };
}

function addNotification(notification) {
    state.notifications.push({ ...notification, id: state.nextId++ });
    if (notification.timeout) {
        setTimeout(() => removeNotification(state.nextId - 1), notification.timeout);
    }
}

function removeNotification(id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
}