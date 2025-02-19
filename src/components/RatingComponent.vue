<template>
  <div class="p-4 border rounded shadow-sm bg-white" v-if="showRating">
    <h2 class="text-2xl font-weight-bold mb-4">Rate the Generated Resume</h2>
    <p class="mb-2">Please rate the following aspects:</p>

    <!-- Content Accuracy -->
     <div class="mb-4">
      <label class="form-label">Content Accuracy:</label>
      <div class="d-flex">
        <button @click="setRating('contentAccuracy', rating - 1)" v-for="rating in 5" :key="`content-${rating}`"
                :class="getStarClass('contentAccuracy', rating)"
                class="btn btn-link p-0 me-1 fs-4">
          ★
        </button>
      </div>
      <p v-if="errors.contentAccuracy" class="text-danger small mt-1">{{ errors.contentAccuracy }}</p>
    </div>

    <!-- Formatting -->
    <div class="mb-4">
      <label class="form-label">Formatting:</label>
      <div class="d-flex">
        <button @click="setRating('formatting', rating - 1)" v-for="rating in 5" :key="`format-${rating}`"
                :class="getStarClass('formatting', rating)"
                class="btn btn-link p-0 me-1 fs-4">
          ★
        </button>
      </div>
      <p v-if="errors.formatting" class="text-danger small mt-1">{{ errors.formatting }}</p>
    </div>

    <!-- Relevance -->
    <div class="mb-4">
      <label class="form-label">Relevance to Template:</label>
      <div class="d-flex">
        <button @click="setRating('relevance', rating - 1)" v-for="rating in 5" :key="`relevance-${rating}`"
                :class="getStarClass('relevance', rating)"
                class="btn btn-link p-0 me-1 fs-4">
          ★
        </button>
      </div>
      <p v-if="errors.relevance" class="text-danger small mt-1">{{ errors.relevance }}</p>
    </div>

    <!-- Overall Quality -->
    <div class="mb-4">
      <label class="form-label">Overall Quality:</label>
      <div class="d-flex">
        <button @click="setRating('overallQuality', rating - 1)" v-for="rating in 5" :key="`overall-${rating}`"
                :class="getStarClass('overallQuality', rating)"
                class="btn btn-link p-0 me-1 fs-4">
          ★
        </button>
      </div>
      <p v-if="errors.overallQuality" class="text-danger small mt-1">{{ errors.overallQuality }}</p>
    </div>

    <button @click="submitRating" class="btn btn-primary">
      Submit Rating
    </button>
    <button @click="closeRating" class="btn btn-secondary ms-2">
      Close
    </button>
    <p v-if="submitError" class="text-danger mt-2">{{ submitError }}</p>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { submitModelRating } from '@/utils/firebaseUtils';
import { auth } from '@/firebase';


export default {
  name: 'RatingComponent',
  props: {
    modelName: {
      type: String,
      required: true,
    }
  },
  setup(props, { emit }) {
    const ratings = reactive({
      contentAccuracy: 0,
      formatting: 0,
      relevance: 0,
      overallQuality: 0,
    });
    const showRating = ref(true);
    const errors = reactive({});
    const submitError = ref("");


    const setRating = (category, value) => {
      ratings[category] = value + 1;
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
      if (ratings.relevance === 0) {
        errors.relevance = 'Please rate relevance.';
        isValid = false;
      }
      if (ratings.overallQuality === 0) {
        errors.overallQuality = 'Please rate Overall Quality.';
        isValid = false;
      }

      return isValid;
    };

    const handleSubmitRating = async () => {
      if (!validateRatings()) {
        return;
      }

      submitError.value = ""; // Reset error
      const user = auth.currentUser;
      if (!user) {
        submitError.value = "You must be logged in to submit a rating.";
        return;
      }

      try {
        await submitModelRating(props.modelName, ratings);
        showRating.value = false;
        emit('rating-submitted');
      } catch (error) {
        submitError.value = error.message; // Use error message from utility.
      }
    };

    const getStarClass = (category, rating) => {
      return {
        'text-warning': ratings[category] >= rating,
        'text-muted': ratings[category] < rating,
      };
    };

    return {
      ratings,
      showRating,
      errors,
      submitError,
      setRating,
      closeRating,
      submitRating: handleSubmitRating,
      validateRatings,
      getStarClass
    };
  }
};
</script>
