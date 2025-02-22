<!-- src/App.vue -->
<template>
  <div id="app" class="bg-light min-vh-100 d-flex flex-column">
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container py-2">
        <RouterLink to="/" class="navbar-brand">Content Builder</RouterLink>
        <div class="navbar-nav">
          <RouterLink v-if="user" to="/leaderboard" class="nav-link">Leaderboard</RouterLink>
          <button v-if="user" @click="handleSignOut" class="btn btn-link nav-link">Sign Out</button>
        </div>
      </div>
    </nav>
    <div class="flex-grow-1">
        <RouterView />
    </div>

     <!-- Global Error Display  -->
    <div v-if="globalError" class="alert alert-danger global-error">
      {{ globalError }}
    </div>
    <div v-if="authLoading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { signOutUser } from '@/utils/auth'; // Import from the auth module
import { ref, onMounted, getCurrentInstance } from 'vue';

export default {
  name: 'App',
  components: {
    RouterView,
    RouterLink
  },
  setup() {
    const router = useRouter();
    const user = ref(null);
    const authLoading = ref(true);
    const globalError = ref(''); // Add global error ref

      const app = getCurrentInstance(); // Access the app instance

    // Set up global error handler
    app.appContext.config.errorHandler = (err, vm, info) => {
      console.error("Global Error:", err, info); // Log for debugging
      globalError.value = "An unexpected error occurred. Please try again later."; // User-friendly message
      // Optionally, send error to a logging service (e.g., Sentry, LogRocket)
    };

    onMounted(() => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        authLoading.value = false;
      });
    });

    const handleSignOut = async () => {
      try {
        await signOutUser();
        router.push('/'); // Navigate to landing page after sign out
      } catch (error) {
        console.error("Sign out error:", error);
        globalError.value = "Failed to sign out. Please try again.";
      }
    };

    return { user, authLoading, handleSignOut, globalError };
  }
};
</script>

<style>
  .global-error{
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 10000;
  }
</style>