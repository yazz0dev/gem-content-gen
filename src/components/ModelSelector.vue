<template>
  <div class="model-selector-wrapper">
    <h3 class="text-center text-white mb-3">Select a Model</h3>
    <div class="model-options-grid">
      <div v-for="model in models" 
           :key="model.name"
           @click="!model.isRateLimited ? selectModel(model.name) : null"
           :class="['model-option', { 'selected': selectedModel === model.name, 'rate-limited': model.isRateLimited }]"
           :title="model.isRateLimited ? 'This model is currently rate-limited. Please try again later.' : ''">
        <h4 class="model-name">{{ model.displayName }}</h4>
        <div class="model-stats">
          <span class="quality">Quality: {{ model.quality }}</span>
          <span class="speed">Speed: {{ model.speed }}</span>
        </div>
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
    const modelStatus = ref(new Map());

    // Watch for changes and check rate limits
    watchEffect(async () => {
      try {
        for (const model of props.models) {
          const isLimited = await checkModelRateLimit(model.name);
          modelStatus.value.set(model.name, isLimited);
        }
      } catch (error) {
        console.error('Error checking rate limits:', error);
        // Set all models as not rate limited on error
        props.models.forEach(model => {
          modelStatus.value.set(model.name, false);
        });
      }
    });

    const selectModel = (modelName) => {
      if (!modelStatus.value.get(modelName)) {
        emit('update:selectedModel', modelName);
      }
    };

    return {
      selectModel,
      modelStatus
    };
  },
};
</script>

<style scoped>
.model-selector-wrapper {
  max-width: 1000px; /* Increased from 800px */
  margin: 0 auto;
}

.model-options-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Force 4 columns */
  gap: 1rem;
  justify-items: center;
  padding: 1rem;
}

.model-option {
  width: 100%;
  max-width: 250px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.model-option:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  background: white;
}

.model-option.selected {
  background: var(--primary-color);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.model-option.selected:hover {
  background: var(--primary-color);
  color: white;
  border-color: white;
}

.model-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.model-stats {
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rate-limited {
  opacity: 0.5; /* Visually dim rate-limited models */
  pointer-events: none; /* Disable clicks on rate-limited models */
  cursor: not-allowed;
}

/* Add other styles from main.css or create new styles as needed */
</style>