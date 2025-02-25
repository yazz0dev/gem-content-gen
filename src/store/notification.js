// src/store/notification.js  (Singular file)
import { reactive } from 'vue';

const state = reactive({
  notifications: [], // Keep the array here
  nextId: 1, // Keep track of the next ID
});

export function useNotificationStore() { // Renamed for clarity
  return state;
}