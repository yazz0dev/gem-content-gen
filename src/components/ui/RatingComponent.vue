<template>
  <Transition name="slide-up">
    <div v-if="showRating" class="rating-overlay">
      <div class="rating-modal">
        <div class="rating-header">
          <h3 class="rating-title">How was the generation?</h3>
          <button @click="closeRating" class="close-button">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="rating-body">
          <!-- Content Accuracy -->
          <div class="rating-item">
            <label class="rating-label">Content Accuracy</label>
            <div class="stars-container">
              <button v-for="rating in 5" 
                      :key="`content-${rating}`"
                      @click="setRating('contentAccuracy', rating - 1)"
                      @mouseover="hoverRating('contentAccuracy', rating)"
                      @mouseleave="hoverRating('contentAccuracy', 0)"
                      :class="getStarClass('contentAccuracy', rating)"
                      class="star-button">
                <i class="bi bi-star-fill"></i>
              </button>
            </div>
            <small class="rating-description">{{ getRatingDescription('contentAccuracy') }}</small>
            <p v-if="errors.contentAccuracy" class="error-text">{{ errors.contentAccuracy }}</p>
          </div>

          <!-- Formatting -->
          <div class="rating-item">
            <label class="rating-label">Formatting</label>
            <div class="stars-container">
              <button v-for="rating in 5" 
                      :key="`format-${rating}`"
                      @click="setRating('formatting', rating - 1)"
                      @mouseover="hoverRating('formatting', rating)"
                      @mouseleave="hoverRating('formatting', 0)"
                      :class="getStarClass('formatting', rating)"
                      class="star-button">
                <i class="bi bi-star-fill"></i>
              </button>
            </div>
            <small class="rating-description">{{ getRatingDescription('formatting') }}</small>
            <p v-if="errors.formatting" class="error-text">{{ errors.formatting }}</p>
          </div>

          <!-- Overall Quality -->
          <div class="rating-item">
            <label class="rating-label">Overall Quality</label>
            <div class="stars-container">
              <button v-for="rating in 5" 
                      :key="`overall-${rating}`"
                      @click="setRating('overallQuality', rating - 1)"
                      @mouseover="hoverRating('overallQuality', rating)"
                      @mouseleave="hoverRating('overallQuality', 0)"
                      :class="getStarClass('overallQuality', rating)"
                      class="star-button">
                <i class="bi bi-star-fill"></i>
              </button>
            </div>
            <small class="rating-description">{{ getRatingDescription('overallQuality') }}</small>
            <p v-if="errors.overallQuality" class="error-text">{{ errors.overallQuality }}</p>
          </div>
        </div>

        <div class="rating-footer">
          <p v-if="submitError" class="error-text mb-3">{{ submitError }}</p>
          <button @click="submitRating" class="submit-button" :disabled="isSubmitting">
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit Rating</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
     <div v-if="showRating" class="bottom-rating-bar">
        <div class="rating-container">
            <div class="stars">
                <button v-for="n in 5" :key="n" class="star" @click="setOverallRating(n)">
                  <i :class="getStarClass('overallQuality', n)" class="bi bi-star-fill"></i>
                </button>
            </div>
            <button class="close-btn" @click="closeRating">
                <i class="bi bi-x"></i>
            </button>
        </div>
    </div>
</template>

<script>
import { ref, reactive, watch } from 'vue';
import { submitModelRating } from '@/composables/useFirebase';

export default {
  name: 'RatingComponent',
  props: {
    modelName: {
      type: String,
      required: true,
    }
  },
  emits: ['rating-submitted', 'rating-closed'],
  setup(props, { emit }) {
    const ratings = reactive({
      contentAccuracy: 0,
      formatting: 0,
      overallQuality: 0,
    });
    
    const hoveredRatings = reactive({
      contentAccuracy: 0,
      formatting: 0,
      overallQuality: 0,
    });

    const showRating = ref(true);
    const errors = reactive({});
    const submitError = ref("");
    const isSubmitting = ref(false);

    const ratingDescriptions = {
      contentAccuracy: [
        '', 'Poor accuracy', 'Fair accuracy', 'Good accuracy', 
        'Very accurate', 'Excellent accuracy'
      ],
      formatting: [
        '', 'Poor formatting', 'Fair formatting', 'Good formatting',
        'Very well formatted', 'Excellent formatting'
      ],
      overallQuality: [
        '', 'Poor quality', 'Fair quality', 'Good quality',
        'Very good quality', 'Excellent quality'
      ]
    };

    const getRatingDescription = (category) => {
      const rating = hoveredRatings[category] || ratings[category];
      return ratingDescriptions[category][rating] || 'Click to rate';
    };

    const hoverRating = (category, value) => {
      hoveredRatings[category] = value;
    };

    const setRating = (category, value) => {
      ratings[category] = value + 1; // Correct: Assigning to a reactive property
        if (category === 'overallQuality') {
            submitRating(); // Auto-submit on overall rating
        }
    };

    const closeRating = () => {
      showRating.value = false; //Hides Component
      emit('rating-closed');
    };

    const validateRatings = () => {
      Object.keys(errors).forEach(key => delete errors[key]); // Clear previous errors
      let isValid = true;

      if (ratings.contentAccuracy === 0) {
        errors.contentAccuracy = 'Please rate content accuracy.';
        isValid = false;
      }
      if (ratings.formatting === 0) {
        errors.formatting = 'Please rate formatting.';
        isValid = false;
      }

      if (ratings.overallQuality === 0) {
        errors.overallQuality = 'Please rate Overall Quality.';
        isValid = false;
      }

      return isValid;
    };

    const submitRating = async () => {
    //  if (!validateRatings()) return; // No need validation, we auto submit

      isSubmitting.value = true;
      submitError.value = "";

      try {
        await submitModelRating(props.modelName, ratings);
        showRating.value = false;
        emit('rating-submitted');
      } catch (error) {
        console.error('Rating submission error:', error);
        submitError.value = "Unable to submit rating. Please try again later.";
        if (error.code === 'permission-denied') {
          submitError.value = "You don't have permission to submit ratings.";
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const getStarClass = (category, rating) => {
      const currentRating = hoveredRatings[category] || ratings[category];
      return {
        'star-filled': currentRating >= rating,
        'star-empty': currentRating < rating,
      };
    };

      // For the bottom bar - simplified to *only* show overall rating and auto-submit
    const setOverallRating = (n) => {
        ratings.overallQuality = n;
        ratings.contentAccuracy = n;  //auto add
        ratings.formatting = n;       //auto add
        submitRating();
    };

        // Watch for changes in ratings and auto-submit when overallQuality changes.
    watch(() => ratings.overallQuality, (newValue, oldValue) => {
        if (newValue !== 0 && newValue !== oldValue ) {
            submitRating();
        }
    });

    return {
      ratings,
      showRating,
      errors,
      submitError,
      isSubmitting,
      setRating,
      closeRating,
      submitRating,
      getStarClass,
      hoverRating,
      getRatingDescription,
      setOverallRating // Add to returned object
    };
  }
};
</script>

<style scoped>
.rating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.rating-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.rating-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
}

.rating-item {
  margin-bottom: 24px;
}

.rating-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}

.stars-container {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.star-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.star-button:hover {
  transform: scale(1.1);
}

.star-filled {
  color: #ffd700;
}

.star-empty {
  color: #e2e8f0;
}

.rating-description {
  display: block;
  color: var(--text-secondary);
  min-height: 20px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-text {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 4px;
}

/* Slide-up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Bottom Rating Bar Styles */
.bottom-rating-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.9); /* Semi-transparent white */
    backdrop-filter: blur(5px); /* Add a blur effect */
    border-top: 1px solid #ddd;
    padding: 0.5rem 1rem;
    z-index: 1000; /* Ensure it's above other content, but below the modal */
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.rating-container {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Space out stars and close button */
    max-width: 500px; /* Limit width */
    margin: 0 auto; /* Center */
}

.stars {
    display: flex;
    gap: 0.5rem; /* Space between stars */
}

.star {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
     color: #e2e8f0; /* Default star color */
    padding: 0;
}
.star-filled{
    color: #ffd700;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #6c757d;
    padding:0;
}
</style>