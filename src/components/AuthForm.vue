<template>
  <div class="auth-form">
    <ul class="nav nav-tabs mb-3" id="authTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button"
          role="tab" aria-controls="login" aria-selected="true">Login</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="signup-tab" data-bs-toggle="tab" data-bs-target="#signup" type="button" role="tab"
          aria-controls="signup" aria-selected="false">Sign Up</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="reset-tab" data-bs-toggle="tab" data-bs-target="#reset" type="button" role="tab"
          aria-controls="reset" aria-selected="false">Reset Password</button>
      </li>
    </ul>

    <div class="tab-content" id="authTabContent">
      <!-- Login Form -->
      <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
        <h2 class="text-2xl font-weight-bold mb-3">Login</h2>
        <form @submit.prevent="handleLogin" class="mb-3">
          <div class="mb-3">
            <label for="login-email" class="form-label">Email</label>
            <input type="email" id="login-email" v-model="loginEmail" required class="form-control">
          </div>
          <div class="mb-3">
            <label for="login-password" class="form-label">Password</label>
            <input type="password" id="login-password" v-model="loginPassword" required class="form-control">
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Login
          </button>
          <p v-if="loginError" class="text-danger mt-2">{{ loginError }}</p>
        </form>
      </div>

      <!-- Signup Form -->
      <div class="tab-pane fade" id="signup" role="tabpanel" aria-labelledby="signup-tab">
        <h2 class="text-2xl font-weight-bold mb-3">Sign Up</h2>
        <form @submit.prevent="handleSignup" class="mb-3">
          <div class="mb-3">
            <label for="signup-email" class="form-label">Email</label>
            <input type="email" id="signup-email" v-model="signupEmail" required class="form-control">
          </div>
          <div class="mb-3">
            <label for="signup-password" class="form-label">Password</label>
            <input type="password" id="signup-password" v-model="signupPassword" required class="form-control">
          </div>
          <button type="submit" class="btn btn-success w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Sign Up
          </button>
          <p v-if="signupError" class="text-danger mt-2">{{ signupError }}</p>
        </form>
      </div>

      <!-- Reset Password Form -->
      <div class="tab-pane fade" id="reset" role="tabpanel" aria-labelledby="reset-tab">
        <h2 class="text-2xl font-weight-bold mb-3">Reset Password</h2>
        <form @submit.prevent="handleResetPassword" class="mb-3">
          <div class="mb-3">
            <label for="reset-email" class="form-label">Email</label>
            <input type="email" id="reset-email" v-model="resetEmail" required class="form-control">
          </div>
          <button type="submit" class="btn btn-secondary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Send Reset Link
          </button>
          <p v-if="resetSuccess" class="text-success mt-2">{{ resetSuccess }}</p>
          <p v-if="resetError" class="text-danger mt-2">{{ resetError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { login, signup, sendPasswordResetEmail } from '@/utils/auth';
import { useRouter } from 'vue-router';


export default {
  name: 'AuthForm',
  setup() {
    const loginEmail = ref('');
    const loginPassword = ref('');
    const loginError = ref('');
    const signupEmail = ref('');
    const signupPassword = ref('');
    const signupError = ref('');
    const resetEmail = ref('');
    const resetSuccess = ref('');
    const resetError = ref('');
    const loading = ref(false);
    const router = useRouter();

    const handleLogin = async () => {
      loginError.value = '';
      loading.value = true;
      try {
        await login(loginEmail.value, loginPassword.value);
        router.push('/');
      } catch (error) {
        loginError.value = error.message; // Use the error message from the auth module.
      } finally {
        loading.value = false;
      }
    };

    const handleSignup = async () => {
      signupError.value = '';
      loading.value = true;
      try {
        await signup(signupEmail.value, signupPassword.value);
        router.push('/');
      } catch (error) {
        signupError.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    const handleResetPassword = async () => {
      resetError.value = '';
      resetSuccess.value = '';
      loading.value = true;
      try {
        await sendPasswordResetEmail(resetEmail.value);
        resetSuccess.value = 'Password reset email sent. Check your inbox.';
      } catch (error) {
        resetError.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    return {
      loginEmail,
      loginPassword,
      loginError,
      signupEmail,
      signupPassword,
      signupError,
      resetEmail,
      resetSuccess,
      resetError,
      loading,
      handleLogin,
      handleSignup,
      handleResetPassword
    };
  }
};
</script>