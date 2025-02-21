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
         <VForm @submit="handleLogin" class="mb-3" :validation-schema="loginSchema">
           <div class="mb-3">
             <label for="login-email" class="form-label">Email</label>
             <Field type="email" id="login-email" name="email" class="form-control" />
             <ErrorMessage name="email" class="text-danger mt-1 small" />
           </div>
           <div class="mb-3">
             <label for="login-password" class="form-label">Password</label>
             <Field type="password" id="login-password" name="password" class="form-control" />
             <ErrorMessage name="password" class="text-danger mt-1 small" />
           </div>
           <button type="submit" class="btn btn-primary w-100" :disabled="loading">
             <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
             Login
           </button>
            <!-- Display API Error, if any -->
           <p v-if="loginApiError" class="text-danger mt-2">{{ loginApiError }}</p>
         </VForm>
       </div>
 
       <!-- Signup Form -->
       <div class="tab-pane fade" id="signup" role="tabpanel" aria-labelledby="signup-tab">
        <h2 class="text-2xl font-weight-bold mb-3">Sign Up</h2>
         <VForm @submit="handleSignup" class="mb-3" :validation-schema="signupSchema">
           <div class="mb-3">
             <label for="signup-email" class="form-label">Email</label>
             <Field type="email" id="signup-email" name="email" class="form-control" />
             <ErrorMessage name="email" class="text-danger mt-1 small" />
           </div>
           <div class="mb-3">
             <label for="signup-password" class="form-label">Password</label>
             <Field type="password" id="signup-password" name="password" class="form-control" />
              <ErrorMessage name="password" class="text-danger mt-1 small" />
           </div>
           <button type="submit" class="btn btn-success w-100" :disabled="loading">
             <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
             Sign Up
           </button>
           <p v-if="signupApiError" class="text-danger mt-2">{{ signupApiError }}</p>
         </VForm>
       </div>
 
       <!-- Reset Password Form -->
       <div class="tab-pane fade" id="reset" role="tabpanel" aria-labelledby="reset-tab">
         <h2 class="text-2xl font-weight-bold mb-3">Reset Password</h2>
         <VForm @submit="handleResetPassword" :validation-schema="resetSchema">
           <div class="mb-3">
              <label for="reset-email" class="form-label">Email</label>
             <Field type="email" id="reset-email" name="email" class="form-control" />
             <ErrorMessage name="email" class="text-danger mt-1 small" />
           </div>
           <button type="submit" class="btn btn-secondary w-100" :disabled="loading">
             <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
             Send Reset Link
           </button>
           <p v-if="resetSuccess" class="text-success mt-2">{{ resetSuccess }}</p>
           <p v-if="resetApiError" class="text-danger mt-2">{{ resetApiError }}</p>
         </VForm>
       </div>
     </div>
   </div>
 </template>

<script>
import { ref } from 'vue';
import { login, signup, sendPasswordResetEmail } from '@/utils/auth';
import { useRouter } from 'vue-router';
import { Form as VForm, Field, ErrorMessage } from 'vee-validate'; // Rename Form to VForm
import * as yup from 'yup';

export default {
  name: 'AuthForm',
  components: {
    VForm, // Use VForm here
    Field,
    ErrorMessage,
  },

  setup() {
    const loginApiError = ref(''); // Separate API error
    const signupApiError = ref('');
    const resetApiError = ref('');
    const resetSuccess = ref('');
    const loading = ref(false);
    const router = useRouter();

    // Define validation schemas using Yup
    const loginSchema = yup.object({
      email: yup.string().required().email(),
      password: yup.string().required(),
    });

    const signupSchema = yup.object({
      email: yup.string().required().email(),
      password: yup.string().required().min(6),
    });
    const resetSchema = yup.object({
      email: yup.string().required().email(),
    });

    const handleLogin = async (values) => {
      loginApiError.value = ''; // Clear previous error
      loading.value = true;
      try {
        await login(values.email, values.password);
        router.push('/');
      } catch (error) {
        console.error("Login Error:", error); // Log the full error
        loginApiError.value = error.message; // Display user-friendly message
      } finally {
        loading.value = false;
      }
    };

    const handleSignup = async (values) => {
      signupApiError.value = '';
      loading.value = true;
      try {
        await signup(values.email, values.password);
        router.push('/');
      } catch (error) {
        console.error("Signup Error:", error);
        signupApiError.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    const handleResetPassword = async (values) => {
      resetApiError.value = '';
      resetSuccess.value = '';
      loading.value = true;
      try {
        await sendPasswordResetEmail(values.email);
        resetSuccess.value = 'Password reset email sent. Check your inbox.';
      } catch (error) {
        console.error("Reset Password Error:", error);
        resetApiError.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    return {
      loginSchema,
      signupSchema,
      resetSchema,
      loginApiError, // Expose the API error
      signupApiError,
      resetApiError,
      resetSuccess,
      loading,
      handleLogin,
      handleSignup,
      handleResetPassword
    };
  }
};
</script>