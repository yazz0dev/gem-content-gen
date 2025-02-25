<!-- src/App.vue (Modified to use AppHeader) -->
<template>
  <div id="app" class="bg-light min-vh-100 d-flex flex-column">
    <AppHeader />

    <div class="flex-grow-1">
      <RouterView />
    </div>

    <NotificationToast />

    <div v-if="authLoading" class="loading-overlay">
      <LoadingSpinner />
    </div>
  </div>
</template>

<script>
import { RouterView } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useNotifications } from '@/composables/useNotifications'; // NEW IMPORT
import NotificationToast from '@/components/NotificationToast.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import AppHeader from '@/components/ui/AppHeader.vue'; // Import AppHeader


export default {
  name: 'App',
  components: {
    RouterView,
    NotificationToast,
    LoadingSpinner,
    AppHeader,
  },
  setup() {
      // Initialize notification system first
    //createNotificationSystem(); //REMOVED
    // Then use it
    const { showNotification } = useNotifications(); // Use the composable
    const authLoading = ref(true);

     const app = getCurrentInstance();
    app.appContext.config.errorHandler = (err, vm, info) => {
      console.error("Global Error:", err, info);
      showNotification("An unexpected error occurred. Please try again later.", "error"); // Use showNotification
    };

    onMounted(() => {
      onAuthStateChanged(auth, () => {
        authLoading.value = false; // Set loading to false when auth state is determined
      });
    });

    return { authLoading };
  }
};
</script>