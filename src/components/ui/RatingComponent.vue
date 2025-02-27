<template>
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
  
  const showRating = ref(true);
  const submitError = ref("");
  const isSubmitting = ref(false);

    // For the bottom bar - simplified to *only* show overall rating and auto-submit
  const setOverallRating = (n) => {
      ratings.overallQuality = n;
      ratings.contentAccuracy = n;  //auto add
      ratings.formatting = n;       //auto add
      submitRating();
  };

  const closeRating = () => {
    showRating.value = false; //Hides Component
    emit('rating-closed');
  };

  const submitRating = async () => {
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
    return {
      'star-filled': ratings[category] >= rating,
      'star-empty': ratings[category] < rating,
    };
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
    submitError,
    isSubmitting,
    closeRating,
    submitRating,
    getStarClass,
    setOverallRating // Add to returned object
  };
}
};
</script>

<style scoped>
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