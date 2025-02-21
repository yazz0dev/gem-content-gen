<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['auth-tab', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="auth-content">
        <!-- Login Form -->
        <VForm v-show="activeTab === 'login'" @submit="handleLogin" class="auth-form">
          <h2 class="auth-title">Welcome Back</h2>
          
          <div class="form-floating mb-3">
            <Field type="email" id="login-email" name="email" class="form-control" placeholder="Email" />
            <label for="login-email">Email</label>
            <ErrorMessage name="email" class="error-message" />
          </div>

          <div class="form-floating mb-3 password-field">
            <Field :type="showPassword ? 'text' : 'password'" 
                   id="login-password" 
                   name="password" 
                   class="form-control" 
                   placeholder="Password" />
            <label for="login-password">Password</label>
            <button type="button" 
                    @click="showPassword = !showPassword"
                    class="password-toggle">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
            <ErrorMessage name="password" class="error-message" />
          </div>

          <button type="submit" class="btn-auth" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Sign In
          </button>
          
          <p v-if="loginApiError" class="error-message text-center mt-3">{{ loginApiError }}</p>
        </VForm>

        <!-- Similar structure for signup and reset forms -->
        <VForm v-show="activeTab === 'signup'" @submit="handleSignup" class="auth-form">
          <h2 class="auth-title">Sign Up</h2>
          
          <div class="form-floating mb-3">
            <Field type="email" id="signup-email" name="email" class="form-control" placeholder="Email" />
            <label for="signup-email">Email</label>
            <ErrorMessage name="email" class="error-message" />
          </div>

          <div class="form-floating mb-3 password-field">
            <Field :type="showPassword ? 'text' : 'password'" 
                   id="signup-password" 
                   name="password" 
                   class="form-control" 
                   placeholder="Password" />
            <label for="signup-password">Password</label>
            <button type="button" 
                    @click="showPassword = !showPassword"
                    class="password-toggle">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
            <ErrorMessage name="password" class="error-message" />
          </div>

          <button type="submit" class="btn-auth" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Sign Up
          </button>
          
          <p v-if="signupApiError" class="error-message text-center mt-3">{{ signupApiError }}</p>
        </VForm>

        <VForm v-show="activeTab === 'reset'" @submit="handleResetPassword" class="auth-form">
          <h2 class="auth-title">Reset Password</h2>
          
          <div class="form-floating mb-3">
            <Field type="email" id="reset-email" name="email" class="form-control" placeholder="Email" />
            <label for="reset-email">Email</label>
            <ErrorMessage name="email" class="error-message" />
          </div>

          <button type="submit" class="btn-auth" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Send Reset Link
          </button>
          
          <p v-if="resetSuccess" class="text-success text-center mt-3">{{ resetSuccess }}</p>
          <p v-if="resetApiError" class="error-message text-center mt-3">{{ resetApiError }}</p>
        </VForm>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { login, signup, sendPasswordResetEmail } from '@/utils/auth';
import { useRouter } from 'vue-router';
import { Form as VForm, Field, ErrorMessage } from 'vee-validate'; // Rename Form to VForm
import * as yup from 'yup';

const activeTab = ref('login'); // Add this line to fix the warning
const tabs = [
  { id: 'login', label: 'Sign In' },
  { id: 'signup', label: 'Sign Up' },
  { id: 'reset', label: 'Reset Password' }
];
const showPassword = ref(false);

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
</script>

<style scoped>
.auth-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.auth-tab {
  flex: 1;
  padding: 1rem;
  border: none;
  background: none;
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
}

.auth-tab.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.auth-content {
  padding: 2rem;
}

.auth-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 600;
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.btn-auth {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-auth:hover:not(:disabled) {
  background: var(--primary-hover);
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .auth-card {
    margin: 1rem;
  }

  .auth-content {
    padding: 1.5rem;
  }

  .btn-auth {
    padding: 0.875rem;
  }
}
</style>