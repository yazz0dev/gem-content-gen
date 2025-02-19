<template>
  <div class="mb-4">
    <h2 class="text-xl font-weight-bold mb-3">Select a Template</h2>
    <div class="row">
      <div v-for="(template, index) in templates" :key="index"
           @click="selectTemplate(template.name)"
           class="col-md-3 mb-4 template-option"
           :class="{ 'selected': selectedTemplate === template.name }"
      >
        <!-- Larger, more descriptive placeholder images -->
        <img :src="template.image" :alt="template.name" class="img-fluid mb-2 rounded">
        <p class="text-center">{{ template.name }}</p>
      </div>
    </div>
    <p v-if="selectionError" class="text-danger mt-2">{{ selectionError }}</p>
  </div>
</template>

<script>
export default {
  name: 'TemplateSelector',
  data() {
    return {
      templates: [
        // Use larger placeholder images for better preview
        { name: 'Template 1', image: 'https://via.placeholder.com/300x400' },
        { name: 'Template 2', image: 'https://via.placeholder.com/300x400' },
        { name: 'Template 3', image: 'https://via.placeholder.com/300x400' },
        { name: 'Template 4', image: 'https://via.placeholder.com/300x400' },
        { name: 'Template 5', image: 'https://via.placeholder.com/300x400' },
        // Add more templates here
      ],
      selectedTemplate: 'Template 1', // Default template
      selectionError: ''
    };
  },
  watch: {
    selectedTemplate(newTemplate) {
      if (!newTemplate) {
        this.selectionError = 'Please select a template.';
      } else {
        this.selectionError = ''; // Clear error if a template is selected
      }
    }
  },
  methods: {
    selectTemplate(templateName) {
      this.selectedTemplate = templateName;
      this.$emit('template-selected', templateName);
    },
  },
  mounted() {
    this.$emit('template-selected', this.selectedTemplate); //Emit on mount
  }
};
</script>