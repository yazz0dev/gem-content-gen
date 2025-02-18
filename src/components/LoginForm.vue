// /src/components/LoginForm.vue (Complete and Correct)
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">Login</h2>
    <form @submit.prevent="handleSubmit" class="mb-3">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" id="email" v-model="email" required class="form-control">
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" id="password" v-model="password" required class="form-control">
      </div>
      <button type="submit" class="btn btn-primary w-100">
        Login
      </button>
      <p v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import { auth } from '@/firebase'; // Import the auth instance
import { signInWithEmailAndPassword } from 'firebase/auth';

export default {
  name: 'LoginForm',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: '',
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = ''; // Clear previous error
      try {
        // Directly await the signInWithEmailAndPassword function.
        await signInWithEmailAndPassword(auth, this.email, this.password);
        // User is signed in.  The onAuthStateChanged listener in App.vue will handle it.
        this.$router.push('/'); // Redirect to home page
      } catch (error) {
        console.error("Login error:", error);
        this.errorMessage = "Login failed.  Please check your email and password."; // User-friendly error
      }
    },
  },
};
</script>