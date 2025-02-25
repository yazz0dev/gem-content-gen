<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <h2>Something went wrong</h2>
      <p>{{ error.message }}</p>
      <button @click="handleReset" class="btn btn-primary">
        Try Again
      </button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script>
import { ref, onErrorCaptured } from 'vue';

export default {
  name: 'ErrorBoundary',
  setup() {
    const error = ref(null);

    onErrorCaptured((err, instance, info) => {
      error.value = err;
      console.error('Error captured:', err, info);
      return false; // Prevent error propagation
    });

    const handleReset = () => {
      error.value = null;
    };

    return {
      error,
      handleReset
    };
  }
};
</script>

<style scoped>
.error-boundary {
  padding: 2rem;
  text-align: center;
  background: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

.error-content {
  max-width: 500px;
  margin: 0 auto;
}
</style>
