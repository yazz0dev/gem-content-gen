<template>
  <div class="model-selector">
    <div class="model-options-wrapper">
      <div class="model-options-container">
        <div v-for="model in models"
             :key="model.id"
             @click="!model.isRateLimited ? selectModel(model.id) : null"
             :class="['model-option', { 'selected': modelValue === model.id, 'rate-limited': model.isRateLimited }]"
             :title="model.isRateLimited ? 'This model is currently unavailable due to rate limits. Please try a different model or try again later.' : ''"
             :style="{ opacity: model.isRateLimited ? 0.5 : 1, pointerEvents: model.isRateLimited ? 'none' : 'auto' }">
          <div class="model-icon">
            <i :class="model.icon"></i>
          </div>
          <h4 class="model-name">{{ model.name }}</h4>
          <p class="model-description">{{ model.description }}</p>
          <div class="model-stats">
            <span class="model-speed">{{ model.speed }}</span>
            <span class="model-quality">{{ model.quality }}</span>
          </div>
           <!-- Selected Indicator -->
          <div v-if="modelValue === model.id" class="selected-indicator">
            <i class="bi bi-check-circle-fill"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue';
import { useFirebase } from '@/composables/useFirebase'; // Updated import
import { auth } from '@/api/firebase.js'; // Import auth

export default {
  name: 'ModelSelector',
  props: {
    models: {
      type: Array,
      required: true,
    },
    modelValue: {  // No change needed here
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { checkModelRateLimit } = useFirebase(); // Destructure from composable
    const modelStatus = ref(new Map());
    const rateLimitError = ref('');

    watchEffect(async () => {
      rateLimitError.value = '';
      const user = auth.currentUser; // Get the current user
      const userId = user ? user.uid : null; // Get the user ID, or null if not logged in
      try {
        for (const model of props.models) {
          const isLimited = await checkModelRateLimit(model.id, userId); // Pass userId
          modelStatus.value.set(model.id, isLimited);
        }
      } catch (error) {
        console.error('Error checking rate limits:', error);
        rateLimitError.value = 'Error checking model availability. Please try again later.';
        props.models.forEach(model => {
          modelStatus.value.set(model.id, false);
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
.model-selector {
  width: 100%;
  overflow: hidden;
}

.model-options-wrapper {
  width: 100%;
  overflow-x: auto;
  padding: 1rem 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.model-options-wrapper::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.model-options-container {
  display: flex;
  gap: 1rem;
  min-width: min-content;
  padding: 0 0.5rem;
}

.model-option {
  position: relative; /* For the selected indicator */
  flex: 0 0 250px;
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: var(--shadow-sm); /* Add a subtle shadow by default */
}

/* Hover effect: only if NOT rate-limited */
.model-option:not(.rate-limited):hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md); /* More pronounced shadow on hover */
}

/* Selected state */
.model-option.selected {
  border-color: var(--primary-color);
  background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2); /* Selected shadow */
}

.model-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.model-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.model-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.model-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

@media (min-width: 1024px) {
  .model-options-container {
    justify-content: center;
    flex-wrap: wrap;
  }

  .model-option {
    flex: 0 0 calc(25% - 1rem);
    min-width: 220px;
  }
}

.rate-limited {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

/* Selected Indicator Styles */
.selected-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: var(--success-color);
  font-size: 1.2rem;
}
</style>