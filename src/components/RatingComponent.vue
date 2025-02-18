<template>
  <div class="p-4 border rounded shadow-sm bg-white" v-if="showRating">
    <h2 class="text-2xl font-weight-bold mb-4">Rate the Generated Resume</h2>
    <p class="mb-2">Please rate the following aspects:</p>

    <div class="mb-4">
      <label class="form-label">Content Accuracy:</label>
      <div class="d-flex">
        <button @click="setRating('contentAccuracy', rating - 1)" v-for="rating in 5" :key="`content-${rating}`"
          :class="{
            'text-warning': ratings.contentAccuracy >= rating,
            'text-muted': ratings.contentAccuracy < rating,
          }"
          class="btn btn-link p-0 me-1 fs-4"
        >
          ★
        </button>
      </div>
      <p v-if="errors.contentAccuracy" class="text-danger small mt-1">{{ errors.contentAccuracy }}</p>
    </div>

    <div class="mb-4">
      <label class="form-label">Formatting:</label>
      <div class="d-flex">
        <button @click="setRating('formatting', rating - 1)" v-for="rating in 5" :key="`format-${rating}`"
          :class="{
            'text-warning': ratings.formatting >= rating,
            'text-muted': ratings.formatting < rating,
          }"
          class="btn btn-link p-0 me-1 fs-4"
        >★</button>
      </div>
      <p v-if="errors.formatting" class="text-danger small mt-1">{{ errors.formatting }}</p>
    </div>

    <div class="mb-4">
      <label class="form-label">Relevance to Template:</label>
      <div class="d-flex">
        <button @click="setRating('relevance', rating - 1)" v-for="rating in 5" :key="`relevance-${rating}`"
          :class="{
            'text-warning': ratings.relevance >= rating,
            'text-muted': ratings.relevance < rating,
          }"
          class="btn btn-link p-0 me-1 fs-4"
        >★</button>
      </div>
      <p v-if="errors.relevance" class="text-danger small mt-1">{{ errors.relevance }}</p>
    </div>

    <div class="mb-4">
      <label class="form-label">Overall Quality:</label>
      <div class="d-flex">
        <button @click="setRating('overallQuality', rating - 1)" v-for="rating in 5" :key="`overall-${rating}`"
          :class="{
            'text-warning': ratings.overallQuality >= rating,
            'text-muted': ratings.overallQuality < rating,
          }"
          class="btn btn-link p-0 me-1 fs-4"
        >★</button>
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
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth } from '@/firebase';

export default {
  name: 'RatingComponent',
  props: {
    modelName: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      ratings: {
        contentAccuracy: 0,
        formatting: 0,
        relevance: 0,
        overallQuality: 0,
      },
      showRating: true,
      errors: {},
      submitError: "",
    };
  },
  methods: {
    setRating(category, value) {
      this.ratings[category] = value + 1;
    },
    closeRating() {
      this.showRating = false; //Hides Component
      this.$emit('rating-closed');
    },
    validateRatings() {
      this.errors = {};
      let isValid = true;

      if (this.ratings.contentAccuracy === 0) {
        this.errors.contentAccuracy = 'Please rate content accuracy.';
        isValid = false;
      }
      if (this.ratings.formatting === 0) {
        this.errors.formatting = 'Please rate formatting.';
        isValid = false;
      }
      if (this.ratings.relevance === 0) {
        this.errors.relevance = 'Please rate relevance.';
        isValid = false;
      }
      if (this.ratings.overallQuality === 0) {
        this.errors.overallQuality = 'Please rate Overall Quality.';
        isValid = false;
      }

      return isValid;
    },
    async submitRating() {
      if (!this.validateRatings()) {
        return;
      }

      this.submitError = ""; // Reset error
      const user = auth.currentUser;
      if (!user) {
        this.submitError = "You must be logged in to submit a rating.";
        return;
      }

      try {
        const modelRef = doc(db, 'modelRatings', this.modelName);
        const modelDoc = await getDoc(modelRef);

        if (modelDoc.exists()) {
          // Update existing document
          await updateDoc(modelRef, {
            contentAccuracy: increment(this.ratings.contentAccuracy),
            formatting: increment(this.ratings.formatting),
            relevance: increment(this.ratings.relevance),
            overallQuality: increment(this.ratings.overallQuality),
            count: increment(1),
          });
        } else {
          // Create the document if it doesn't exist
          await setDoc(modelRef, {
            contentAccuracy: this.ratings.contentAccuracy,
            formatting: this.ratings.formatting,
            relevance: this.ratings.relevance,
            overallQuality: this.ratings.overallQuality,
            count: 1,
          });
        }
        this.showRating = false;
        this.$emit('rating-submitted');

      } catch (error) {
        console.error("Error submitting rating:", error);
        this.submitError = 'Failed to submit rating. Please try again.';
      }
    },
  },
};
</script>