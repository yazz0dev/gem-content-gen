<template>
  <div v-if="loading" class="d-flex justify-content-center align-items-center" style="min-height: 100px;">
      <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
      </div>
  </div>
</template>

<script>
export default {
name: 'LoadingSpinner',
props: {
  loading: {
    type: Boolean,
    default: false,
  },
},
};
</script>
