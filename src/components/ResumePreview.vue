// /src/components/ResumePreview.vue (Complete and Correct)
<template>
  <div class="p-4 border rounded shadow-sm">
    <h2 class="text-xl font-weight-bold mb-4">Resume Preview</h2>
    <div v-html="sanitizedResumeHtml" class="resume-preview"></div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  name: 'ResumePreview',
  props: {
    resumeHtml: {
      type: String,
      default: '',
    },
  },
  computed: {
    sanitizedResumeHtml() {
      return DOMPurify.sanitize(this.resumeHtml);
    },
  },
};
</script>

<style scoped>
.resume-preview {
  /*  Bootstrap will handle the overall styling now.
      You might add some basic styles here if you need
      to override Bootstrap's defaults for the preview. */
  font-family: sans-serif;  /* Example */
}
</style>