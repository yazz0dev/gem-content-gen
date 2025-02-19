<template>
  <div class="mb-4">
    <h2 class="text-xl font-weight-bold mb-2">Select a Model</h2>
    <div class="model-selector">
      <div v-for="model in models" :key="model.name"
           @click="!model.isRateLimited ? selectModel(model.name) : null"
           class="model-option"
           :class="{ 'selected': selectedModel === model.name, 'rate-limited': model.isRateLimited }"
           :title="model.isRateLimited ? 'This model is currently rate-limited. Please try again later.' : ''"
      >
        <p class="mb-1 font-weight-bold">{{ model.displayName }}</p>
        <!-- Use user-friendly indicators instead of RPM/TPM -->
        <p class="mb-0 text-muted">Quality: {{ model.quality }}</p>
        <p class="mb-0 text-muted">Speed: {{ model.speed }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue';
import { checkModelRateLimit } from '@/utils/firebaseUtils';

export default {
  name: 'ModelSelector',
  props: {
    models: {
      type: Array,
      required: true,
    },
    selectedModel: { // Receive selectedModel as a prop
        type: String,
        required: true,
    },
  },
  setup(props, { emit }) {
    const selectModel = (modelName) => {
      emit('update:selectedModel', modelName); // Use update:modelValue for two-way binding
    };

    // Use watchEffect to reactively check rate limits
    watchEffect(async () => {
      for (const model of props.models) {
        model.isRateLimited = await checkModelRateLimit(model.name);
      }
    });

    return {
      selectModel,
    };
  },
};
</script>

<style scoped>
.rate-limited {
  opacity: 0.5; /* Visually dim rate-limited models */
  pointer-events: none; /* Disable clicks on rate-limited models */
  cursor: not-allowed;
}

/* Add other styles from main.css or create new styles as needed */
</style>