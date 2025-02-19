<template>
  <div class="main-container">
    <!-- Modern Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Craft Your Perfect Resume</h1>
        <p class="hero-description">
          Transform your career journey into a compelling story. Our AI-powered platform 
          helps you create professional resumes that leave lasting impressions.
        </p>
        <!-- Feature Cards -->
        <div class="feature-cards">
          <div class="feature-card">
            <i class="bi bi-lightning-fill"></i>
            <h3 class="feature-title">Lightning Fast</h3>
            <p class="feature-description">Generate your professional resume in under 5 minutes</p>
          </div>
          <div class="feature-card">
            <i class="bi bi-magic"></i>
            <h3 class="feature-title">AI-Powered</h3>
            <p class="feature-description">Advanced AI helps craft compelling content tailored to your career</p>
          </div>
          <div class="feature-card">
            <i class="bi bi-check-circle"></i>
            <h3 class="feature-title">ATS-Optimized</h3>
            <p class="feature-description">Engineered to pass Applicant Tracking Systems with ease</p>
          </div>
        </div>
        <ModelSelector 
          :models="models" 
          v-model:selectedModel="selectedModel" 
          class="model-selector-container"
        />
      </div>
    </div>

    <!-- Auth Section -->
    <div v-if="!user" class="auth-section">
      <div class="auth-content">
        <h2>Start Your Journey</h2>
        <p>Join thousands of professionals who've elevated their careers</p>
        <button @click="showAuthModal = true" class="cta-button">
          <i class="bi bi-person-plus me-2"></i> Create Your Resume
        </button>
        <p class="auth-note">No credit card required • Free to start</p>
      </div>
      <AuthForm v-if="showAuthModal" class="auth-form-modal" />
    </div>

    <div v-else class="main-content">
      <!-- Template Selection -->
      <div class="section template-section">
        <div class="section-header">
          <h2>Choose Your Design</h2>
          <p>Select a template that matches your professional style</p>
        </div>
        <TemplateSelector 
          @template-selected="handleTemplateSelection" 
          class="template-grid"
        />
      </div>

      <!-- Form Section -->
      <ResumeForm 
        :selectedTemplate="selectedTemplate" 
        @generate-resume="handleGenerateResume"
        class="resume-form-section"
      />

      <!-- Preview Section -->
      <div v-if="resumeHtml" class="preview-section" :class="{ 'active': resumeHtml }">
        <div class="preview-header">
          <h2>Preview</h2>
          <button @click="downloadResume" class="download-button">
            <i class="bi bi-download"></i> Download PDF
          </button>
        </div>
        
        <ResumePreview 
          :resumeHtml="resumeHtml" 
          :resumeData="resumeData" 
          class="preview-container"
        />

        <CustomizationPrompts 
          v-if="resumeHtml" 
          @prompt-selected="handlePromptSelected"
          @prompt-cleared="handlePromptCleared" 
          class="customization-section"
        />

        <RatingComponent 
          v-if="showRating" 
          :model-name="selectedModel" 
          @rating-submitted="hideRatingComponent"
          @rating-closed="hideRatingComponent" 
          class="rating-section"
        />
      </div>
    </div>

    <LoadingSpinner :loading="isLoading" />
    
    <div v-if="errorMessage" class="error-message" role="alert">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ResumeForm from "@/components/ResumeForm.vue";
import ResumePreview from "@/components/ResumePreview.vue";
import TemplateSelector from "@/components/TemplateSelector.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import RatingComponent from "@/components/RatingComponent.vue";
import CustomizationPrompts from "@/components/CustomizationPrompts.vue";
import AuthForm from "@/components/AuthForm.vue";
import ModelSelector from "@/components/ModelSelector.vue";
import { generateResume } from '@/utils/generation';
import { canGenerateResume, updateLastGenerationDate, fetchModelRateLimits, checkModelRateLimit } from '@/utils/firebaseUtils';
import html2pdf from 'html2pdf.js';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';


export default {
  name: "HomeView",
  components: {
    ResumeForm,
    ResumePreview,
    TemplateSelector,
    LoadingSpinner,
    RatingComponent,
    CustomizationPrompts,
    AuthForm,
    ModelSelector,
  },
  setup() {
    const isLoading = ref(false);
    const selectedTemplate = ref("Template 1");
    const selectedModel = ref("gemini-2.0-pro-exp-02-05");
    const models = ref([
      { name: 'gemini-2.0-flash-lite-preview-02-05', displayName: 'Gemini 2.0 Flash-Lite', quality: 'Moderate', speed: 'Fast', isRateLimited: false },
      { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', quality: 'Moderate', speed: 'Fast', isRateLimited: false },
      { name: 'gemini-2.0-flash-thinking-exp-01-21', displayName: 'Gemini 2.0 Flash Thinking', quality: 'High', speed: 'Moderate', isRateLimited: false },
      { name: 'gemini-2.0-pro-exp-02-05', displayName: 'Gemini 2.0 Pro', quality: 'Very High', speed: 'Slower', isRateLimited: false }
    ]);
    const resumeHtml = ref("");
    const resumeData = ref(null);
    const errorMessage = ref("");
    const showRating = ref(false);
    const selectedCustomizationPrompt = ref("");
    const showAuthModal = ref(false);
    const router = useRouter();

    const user = ref(null);

    // Add auth state listener
    let unsubscribe;
    onMounted(() => {
      unsubscribe = auth.onAuthStateChanged((currentUser) => {
        user.value = currentUser;
      });
    });

    // Clean up the listener when component unmounts
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    const handleTemplateSelection = (template) => {
      selectedTemplate.value = template;
      resumeHtml.value = "";
      resumeData.value = null;
      showRating.value = false;
    };

    const handlePromptSelected = (prompt) => {
      selectedCustomizationPrompt.value = prompt;
      // Regenerate the resume immediately when a prompt is selected
      regenerateWithPrompt();
    };

    const handlePromptCleared = () => {
      selectedCustomizationPrompt.value = "";
    };

    const handleGenerateResume = async (data) => {
      const currentUser = auth.currentUser;
      errorMessage.value = "";

      if (!currentUser) {
        showAuthModal.value = true;
        return;
      }

      const userId = currentUser.uid;

      //CHECK USER RATE LIMIT
      if (!(await canGenerateResume(userId))) {
        errorMessage.value = "You have reached the daily limit of 1 resume generation. Please try again tomorrow.";
        return;
      }

      //CHECK MODEL RATE LIMIT
      if (await checkModelRateLimit(selectedModel.value)) {
        errorMessage.value = "This model is currently rate-limited.  Please select a different model or try again later.";
        return; // Prevent generation
      }
      isLoading.value = true;
      resumeHtml.value = "";
      resumeData.value = null;
      showRating.value = false; // Hide rating until *after* regeneration

      try {
        const generated = await generateResume(data.formData, data.selectedTemplate, "", selectedModel.value); // Initial generation: NO prompt
        resumeHtml.value = generated.html;
        resumeData.value = data.formData;
        await updateLastGenerationDate(userId);
        // showRating.value = true; //Move after regeneration

      } catch (error) {
        errorMessage.value = error.message;
      } finally {
        isLoading.value = false;
      }
    };

    const regenerateWithPrompt = async () => {
      if (!selectedCustomizationPrompt.value) {
        return; // Don't regenerate if no prompt is selected
      }

      isLoading.value = true;
      showRating.value = false; // Hide the rating component
      try {
        // Use the *existing* resumeData and selectedTemplate
        const generated = await generateResume(resumeData.value, selectedTemplate.value, selectedCustomizationPrompt.value, selectedModel.value);
        resumeHtml.value = generated.html; // Update the existing resumeHtml
        showRating.value = true;
      } catch (error) {
        errorMessage.value = error.message;
      } finally {
        isLoading.value = false;
        selectedCustomizationPrompt.value = ""; // Clear the prompt after use
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

    onMounted(async () => {
      try {
        // Not used for now, using seperate checks
        // const rateLimits = await fetchModelRateLimits();
      } catch (error) {
        errorMessage.value = error.message; // Display error if fetching fails
      }
    });

    return {
      isLoading,
      selectedTemplate,
      selectedModel,
      models,
      resumeHtml,
      resumeData,
      errorMessage,
      showRating,
      selectedCustomizationPrompt,
      showAuthModal,
      user,
      handleTemplateSelection,
      handlePromptSelected,
      handlePromptCleared,
      handleGenerateResume,
      regenerateWithPrompt,
      downloadResume,
      hideRatingComponent
    };
  }
};
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(30, 64, 175, 0.9) 100%);
  z-index: 1;
}

.hero-section > * {
  position: relative;
  z-index: 2;
}

.hero-subtitle {
  font-size: 1.25rem;
  max-width: 800px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  backdrop-filter: blur(8px);
}

.progress-container {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-container {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  margin-bottom: 2rem;
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.preview-section {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2rem;
}

.btn-primary {
  background: #2c3e50;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #34495e;
  transform: translateY(-2px);
}

.btn-success {
  background: #27ae60;
  border: none;
}

.btn-success:hover {
  background: #2ecc71;
}

/* Enhanced stepper styles */
.step {
  flex: 1;
  text-align: center;
  padding: 0 1rem;
}

.step-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #95a5a6;
  transition: all 0.3s ease;
}

.step.active .step-icon {
  color: #3498db;
}

.step.completed .step-icon {
  color: #27ae60;
}

.step-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.step-description {
  font-size: 0.875rem;
  color: #7f8c8d;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .step-description {
    display: none;
  }
}

.feature-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 1.2s ease-out;
}

.feature-card i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
}

.feature-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}
</style>