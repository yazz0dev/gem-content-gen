//src/components/ui/NotificationToast.vue
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
import { useNotifications } from '@/composables/useNotification'; 

export default {
  name: 'NotificationToast',
  setup() {
    const { notifications, removeNotification } = useNotifications(); 

    return {
      notifications,
      removeNotification,
    };
  },
};
</script>

<style scoped>
/* Basic Styles - Customize as needed */
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1050; /* Ensure it's above other elements */
}

.notification-toast {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 300px; /* Limit width */
  transition: all 0.3s ease;
}

.notification-content {
  flex-grow: 1;
  margin-right: 1rem;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6c757d;
}

.notification-close:hover {
  color: #212529;
}

/* Notification Types */
.notification-toast.success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.notification-toast.error {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.notification-toast.info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.notification-toast.warning {
  background-color: #fff3cd;
  border-color: #ffeeba;
  color: #856404;
}

/* Animation Styles */
.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px); /* Slide in/out from the right */
}
</style>