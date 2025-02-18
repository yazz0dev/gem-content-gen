// /src/components/SignupForm.vue (Complete and Correct)
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">Sign Up</h2>
    <form @submit.prevent="handleSubmit" class="mb-3">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" id="email" v-model="email" required class="form-control">
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" id="password" v-model="password" required class="form-control">
      </div>
      <button type="submit" class="btn btn-success w-100">
        Sign Up
      </button>
      <p v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

export default {
  name: 'SignupForm',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: '',
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        // Create a user document in Firestore (optional, but good for storing additional user data)
        await setDoc(doc(db, "users", user.uid), {
          // Add any initial user data here (e.g., lastGenerationDate: null)
          lastGenerationDate: null, // Initialize lastGenerationDate
        });
        this.$router.push('/'); //Redirect

      } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 'auth/weak-password') {
          this.errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/email-already-in-use') {
          this.errorMessage = 'The email address is already in use by another account.';
        } else {
          this.errorMessage = "Signup failed. Please try again.";
        }
      }
    },
  },
};
</script>