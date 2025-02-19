<template>
  <div id="app" class="bg-light min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container py-2">
        <RouterLink to="/" class="navbar-brand">Resume Builder</RouterLink>
        <div class="navbar-nav">
          <RouterLink v-if="user" to="/leaderboard" class="nav-link">Leaderboard</RouterLink>
          <button v-if="user" @click="handleSignOut" class="btn btn-link nav-link">Sign Out</button>
        </div>
      </div>
    </nav>
    <RouterView />
    <div v-if="authLoading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
import { RouterView, RouterLink } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { signOutUser } from '@/utils/auth'; // Import from the auth module
import { ref, onMounted } from 'vue';

export default {
  name: 'App',
  components: {
    RouterView,
    RouterLink
  },
  setup() {
    const user = ref(null);
    const authLoading = ref(true);

    onMounted(() => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        authLoading.value = false;
      });
    });

    const handleSignOut = async () => {
      try {
        await signOutUser();
      } catch (error) {
        console.error("Sign out error:", error);
      }
    };

    return { user, authLoading, handleSignOut };
  }
};
</script>