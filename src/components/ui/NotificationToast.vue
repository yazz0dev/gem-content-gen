<!-- src/components/NotificationToast.vue (Modified) -->
<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-toast"
        :class="notification.type"
      >
        <div class="notification-content">
          {{ notification.message }}
        </div>
        <button
          class="notification-close"
          @click="removeNotification(notification.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { useNotifications } from '@/composables/useNotifications'; //NEW IMPORT

export default {
  name: 'NotificationToast',
  setup() {
    const { notifications, removeNotification } = useNotifications(); // Use the composable

    return {
      notifications,
      removeNotification,
    };
  },
};
</script>