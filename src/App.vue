// /src/App.vue (Complete and Correct)
<template>
  <div id="app" class="bg-light min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container">
        <RouterLink to="/" class="navbar-brand">Resume Builder</RouterLink>
        <div class="navbar-nav">
          <RouterLink v-if="!user" to="/login" class="nav-link">Login</RouterLink>
          <RouterLink v-if="!user" to="/signup" class="nav-link">Sign Up</RouterLink>
          <RouterLink v-if="user" to="/leaderboard" class="nav-link">Leaderboard</RouterLink>
          <button v-if="user" @click="signOut" class="btn btn-link nav-link">Sign Out</button>
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
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default {
  name: 'App',
  components: {
    RouterView,
    RouterLink
  },
  data() {
    return {
      user: null,
      authLoading: true,
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.authLoading = false;
    });
  },
  methods: {
    async signOut() {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    },
  }
};
</script>