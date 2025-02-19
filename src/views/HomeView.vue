<template>
  <div class="container my-4">
    <h1 class="text-4xl font-weight-bold text-center mb-4">AI Resume Builder</h1>

    <div v-if="!user">
       <TemplateSelector @template-selected="handleTemplateSelection" />
      <CustomizationPrompts @prompt-selected="handlePromptSelected" @prompt-cleared="handlePromptCleared" />
      <ResumeForm :selectedTemplate="selectedTemplate" @generate-resume="handleGenerateResume" />
      <!--<AuthForm /> -->
    </div>
    <div v-else>
       <TemplateSelector @template-selected="handleTemplateSelection" />
      <CustomizationPrompts @prompt-selected="handlePromptSelected" @prompt-cleared="handlePromptCleared" />
      <ResumeForm :selectedTemplate="selectedTemplate" @generate-resume="handleGenerateResume" />

       <div v-if="resumeHtml" class="mt-4 fade-in" :class="{ 'active': resumeHtml }">
        <ResumePreview :resumeHtml="resumeHtml" :resumeData="resumeData" />
        <RatingComponent v-if="showRating" :model-name="selectedModel" @rating-submitted="hideRatingComponent"
                         @rating-closed="hideRatingComponent"/>
        <div class="mt-4 text-center">
          <button @click="downloadResume" class="btn btn-primary">Download PDF</button>
        </div>
      </div>
    </div>

    <LoadingSpinner :loading="isLoading" />
    <div v-if="errorMessage" class="alert alert-danger mt-4" role="alert">
      <strong>Error!</strong>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import ResumeForm from "@/components/ResumeForm.vue";
import ResumePreview from "@/components/ResumePreview.vue";
import TemplateSelector from "@/components/TemplateSelector.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import RatingComponent from "@/components/RatingComponent.vue";
import CustomizationPrompts from "@/components/CustomizationPrompts.vue";
import AuthForm from "@/components/AuthForm.vue"; // Import
import { generateResume } from '@/utils/generation';
import { canGenerateResume, updateLastGenerationDate } from '@/utils/firebaseUtils';
import html2pdf from 'html2pdf.js';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router'; // Import useRouter



export default {
  name: "HomeView",
  components: {
    ResumeForm,
    ResumePreview,
    TemplateSelector,
    LoadingSpinner,
    RatingComponent,
    CustomizationPrompts,
  },
  setup() {
    const isLoading = ref(false);
    const selectedTemplate = ref("Template 1");
    const selectedModel = ref("gemini-1.5-pro");
    const resumeHtml = ref("");
    const resumeData = ref(null); // Store the raw data
    const errorMessage = ref("");
    const showRating = ref(false);
    const selectedCustomizationPrompt = ref("");
    const router = useRouter(); // Use useRouter


      // Computed property for the current user
    const user = computed(() => auth.currentUser);

    const handleTemplateSelection = (template) => {
      selectedTemplate.value = template;
      resumeHtml.value = "";
      resumeData.value = null; // Clear data too
      showRating.value = false;
    };

    const handlePromptSelected = (prompt) => {
      selectedCustomizationPrompt.value = prompt;
    };

    const handlePromptCleared = () => {
       selectedCustomizationPrompt.value = "";
    };

    const handleGenerateResume = async (data) => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Redirect to /auth if not logged in
        router.push('/auth');
        return; // Important: Stop execution here
      }

      const userId = currentUser.uid;

      if (!(await canGenerateResume(userId))) {
        errorMessage.value = "You have reached the daily limit of 1 resume generation. Please try again tomorrow.";
        return;
      }

      isLoading.value = true;
      resumeHtml.value = "";
      resumeData.value = null; // Clear previous data
      errorMessage.value = "";

      try {
        const generated = await generateResume(data.formData, data.selectedTemplate, selectedCustomizationPrompt.value, selectedModel.value);
        resumeHtml.value = generated.html;
        resumeData.value = data.formData;  // Store for the preview component.
        await updateLastGenerationDate(userId);
        showRating.value = true;

      } catch (error) {
        errorMessage.value = error.message; // Use the error message.
      } finally {
        isLoading.value = false;
      }
    };

    const downloadResume = () => {
      const element = document.createElement('div');
      element.innerHTML = resumeHtml.value;  // Use the sanitized HTML.
      const opt = {
        margin: 0.5,
        filename: 'my-resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        console.log("PDF generated successfully");
      }).catch(err => {
        console.error("PDF generation failed:", err);
        errorMessage.value = "Failed to generate PDF.  Please try again.";
      });
    };


    const hideRatingComponent = () => {
      showRating.value = false;
    };

    return {
      isLoading,
      selectedTemplate,
      selectedModel,
      resumeHtml,
      resumeData,
      errorMessage,
      showRating,
      selectedCustomizationPrompt,
      user, // Expose the user
      handleTemplateSelection,
      handlePromptSelected,
      handlePromptCleared,
      handleGenerateResume,
      downloadResume,
      hideRatingComponent
    };
  }
};
</script>
