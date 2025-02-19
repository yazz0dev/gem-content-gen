<template>
  <div class="p-4 border rounded shadow-sm bg-white mb-4">
    <h2 class="text-2xl font-weight-bold mb-4">Customize Your Resume</h2>
    <p class="mb-2">Select a prompt to further refine your resume:</p>

    <div class="mb-3">
      <div v-for="(prompt, index) in prompts" :key="index" class="form-check">
        <input type="radio" :id="`prompt-${index}`" name="customizationPrompt" :value="prompt.text"
          v-model="selectedPrompt" class="form-check-input">
        <label :for="`prompt-${index}`" class="form-check-label">{{ prompt.label }}</label>
      </div>

      <div class="form-check">
        <input type="radio" id="custom-prompt" name="customizationPrompt" value="custom" v-model="selectedPrompt"
          class="form-check-input">
        <label for="custom-prompt" class="form-check-label">Custom Prompt</label>
      </div>
      <textarea v-if="selectedPrompt === 'custom'" v-model="customPromptText" rows="2"
        placeholder="Enter your custom prompt here..." class="form-control mt-1"></textarea>
    </div>

    <!-- Changed button label -->
    <button @click="applyPrompt" :disabled="!selectedPrompt" class="btn btn-primary mt-4">
      Regenerate with Prompt
    </button>
    <button @click="clearPrompt" class="btn btn-secondary mt-4 ms-3">
      Clear
    </button>
  </div>
</template>

<script>
// ... (rest of your existing script)
export default {
  name: 'CustomizationPrompts',
  data() {
    return {
      prompts: [
        { label: 'Make the summary more achievement-oriented.', text: 'Focus on quantifiable achievements in the summary.' },
        { label: 'Highlight leadership skills in work experience.', text: 'Emphasize leadership roles and accomplishments in the work experience section.' },
        { label: 'Tailor the resume for the tech industry.', text: 'Adapt the resume to be relevant to the technology industry.' },
        { label: 'Use more action verbs.', text: 'Use strong action verbs throughout the resume.' },
        { label: 'Shorten the overall length.', text: 'Make the resume more concise.' },
        { label: "Emphasize skills relevant to project management.", text: "Highlight skills related to project management, such as planning, execution, and team leadership." },
        { label: "Include more technical details in project descriptions.", text: "Provide more in-depth technical information about projects undertaken." },
        { label: "Focus on results and impact.", text: "Prioritize describing the outcomes and impact of your work, rather than just listing duties." },
        { label: "Improve the formatting for better readability.", text: "Optimize the layout and formatting to enhance readability and visual appeal." },
        { label: "Add a section for awards and recognitions.", text: "Include a dedicated section to showcase any awards, honors, or recognitions received." },
      ],
      selectedPrompt: '',
      customPromptText: '',
    };
  },
  methods: {
    applyPrompt() {
      const promptToEmit = this.selectedPrompt === 'custom' ? this.customPromptText : this.selectedPrompt;

      if (promptToEmit) {
        this.$emit('prompt-selected', promptToEmit);
      }
    },
    clearPrompt() {
      this.selectedPrompt = '';
      this.customPromptText = '';
      this.$emit('prompt-cleared');
    },
  },
};
</script>