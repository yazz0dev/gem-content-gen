<template>
  <div class="model-selector-wrapper">
    <h3 class="text-center text-white mb-3">Select a Model</h3>
    <p v-if="rateLimitError" class="text-danger text-center">{{ rateLimitError }}</p>
    <div class="model-options-grid">
      <div v-for="model in models"
           :key="model.id"
           @click="!model.isRateLimited ? selectModel(model.id) : null"
           :class="['model-option', { 'selected': modelValue === model.id, 'rate-limited': model.isRateLimited }]"
           :title="model.isRateLimited ? 'This model is currently rate-limited. Please try again later.' : ''">
        <div class="model-info">
          <i :class="model.icon"></i>
          <h4 class="model-name">{{ model.name }}</h4>
          <p class="model-description">{{ model.description }}</p>
          <div class="model-stats">
            <span class="model-rating">
              <i class="bi bi-star-fill"></i> {{ model.rating }}
            </span>
            <span class="model-speed">
              {{ model.speed }}
            </span>
          </div>
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
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const modelStatus = ref(new Map());
    const rateLimitError = ref('');

    watchEffect(async () => {
      rateLimitError.value = '';
      try {
        for (const model of props.models) {
          const isLimited = await checkModelRateLimit(model.name);
          modelStatus.value.set(model.name, isLimited);
        }
      } catch (error) {
        console.error('Error checking rate limits:', error);
        rateLimitError.value = 'Error checking model availability. Please try again later.';
        props.models.forEach(model => {
          modelStatus.value.set(model.name, false);
        });
      }
    });

    const selectModel = (modelId) => {
      if (!modelStatus.value.get(modelId)) {
        emit('update:modelValue', modelId);
      }
    };

    return {
      selectModel,
      modelStatus,
      rateLimitError
    };
  },
};
</script>

<style scoped>
.model-selector-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.model-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  cursor: pointer;
}

.model-option:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background: white;
}

.model-option.selected {
  border-color: var(--primary-color);
  background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.model-option.selected:hover {
  background: var(--primary-color);
  color: white;
  border-color: white;
}

.model-info {
  text-align: center;
}

.model-info i {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.model-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.model-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.model-stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.model-rating i {
  color: #fbbf24;
  font-size: 1rem;
  margin-right: 0.25rem;
}

.rate-limited {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>