<template>
  <div class="main-container">
    <!-- Modern Hero Section (Only for unauthenticated users) -->
      <Transition name="fade">
        <div v-if="!user" class="hero-section">
            <div class="hero-content">
              <h1 class="hero-title">Craft Your Perfect Content</h1>
              <p class="hero-description">
                Transform your ideas into compelling content. Our AI-powered platform
                helps you create professional content that leaves lasting impressions.
              </p>
              <!-- Feature Cards -->
              <div class="feature-cards">
                <div class="feature-card">
                  <i class="bi bi-lightning-fill"></i>
                  <h3 class="feature-title">Lightning Fast</h3>
                  <p class="feature-description">Generate your content in minutes.</p>
                </div>
                <div class="feature-card">
                  <i class="bi bi-magic"></i>
                  <h3 class="feature-title">AI-Powered</h3>
                  <p class="feature-description">Advanced AI helps craft compelling content tailored to your needs.</p>
                </div>
                <div class="feature-card">
                  <i class="bi bi-check-circle"></i>
                  <h3 class="feature-title">High Quality</h3>
                  <p class="feature-description">Create professional, polished content.</p>
                </div>
              </div>
            </div>
        </div>
    </Transition>


    <!-- Auth Section -->
      <Transition name="fade">
        <div v-if="!user" class="auth-section">
            <div class="auth-content">
              <h2>Start Your Journey</h2>
              <p>Join thousands of professionals who've elevated their careers</p>
              <button @click="showAuthModal = true" class="cta-button">
                <i class="bi bi-person-plus me-2"></i> Create Your Content
              </button>
              <p class="auth-note">No credit card required • Free to start</p>
            </div>
          <AuthForm v-if="showAuthModal" class="auth-form-modal" />
        </div>
      </Transition>



    <div v-if="user" class="main-content">
       <!-- Content Type Selection -->
      <div class="section content-type-section mb-4">
          <h2 class="text-center mb-3">What would you like to create?</h2>
          <div class="d-flex justify-content-center">
            <select v-model="contentType" class="form-select w-auto">
              <option value="resume">Resume</option>
              <option value="poster">Poster</option>
              <option value="social">Social Media Post</option>
              <option value="custom">Custom HTML</option>
            </select>
          </div>
        </div>

        <Transition name="slide">
            <div v-if="contentType">
                <!-- Template Selection (for all content types except "custom") -->
                <div v-if="contentType !== 'custom'" class="section template-section">
                <div class="section-header">
                    <h2>Choose Your Design</h2>
                    <p>Select a template that matches your style</p>
                </div>
                <TemplateSelector
                    @template-selected="handleTemplateSelection"
                    class="template-grid"
                />
                </div>

                <!-- Model Selection -->
                <ModelSelector
                    :models="models"
                    v-model:selectedModel="selectedModel"
                    class="model-selector-container"
                />
                <!-- Form Section -->
                <ContentForm
                :contentType="contentType"
                :selectedTemplate="selectedTemplate"
                @generate-content="handleGenerateContent"
                class="content-form-section"
                />

                <!-- Preview Section -->
                <Transition name="fade">
                    <div v-if="contentHtml" class="preview-section" >
                    <ContentPreview
                        :contentHtml="contentHtml"
                        :contentData="contentData"
                        :contentType="contentType"
                        @content-updated="handleContentUpdate"
                        class="preview-container"
                    />

                    <RatingComponent
                        v-if="showRating && (contentType === 'resume')"
                        :model-name="selectedModel"
                        @rating-submitted="hideRatingComponent"
                        @rating-closed="hideRatingComponent"
                        class="rating-section"
                    />
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>

    <LoadingSpinner :loading="isLoading" />

    <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ContentForm from "@/components/ContentForm.vue";
import ContentPreview from "@/components/ContentPreview.vue";
import TemplateSelector from "@/components/TemplateSelector.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import RatingComponent from "@/components/RatingComponent.vue";
import AuthForm from "@/components/AuthForm.vue";
import ModelSelector from "@/components/ModelSelector.vue";
import { generateContent } from '@/utils/generation';
import { canGenerateResume, updateLastGenerationDate, fetchModelRateLimits, checkModelRateLimit } from '@/utils/firebaseUtils';
// import html2pdf from 'html2pdf.js'; //Removed from here
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';


export default {
  name: "HomeView",
  components: {
    ContentForm,
    ContentPreview,
    TemplateSelector,
    LoadingSpinner,
    RatingComponent,
    AuthForm,
    ModelSelector,
  },
  setup() {
    const isLoading = ref(false);
    const selectedTemplate = ref("Modern"); // Default
    const selectedModel = ref("gemini-2.0-pro-exp-02-05");  //Default
    const models = ref([
      { name: 'gemini-2.0-flash-lite-preview-02-05', displayName: 'Gemini 2.0 Flash-Lite', quality: 'Moderate', speed: 'Fast', isRateLimited: false },
      { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', quality: 'Moderate', speed: 'Fast', isRateLimited: false },
      { name: 'gemini-2.0-flash-thinking-exp-01-21', displayName: 'Gemini 2.0 Flash Thinking', quality: 'High', speed: 'Moderate', isRateLimited: false },
      { name: 'gemini-2.0-pro-exp-02-05', displayName: 'Gemini 2.0 Pro', quality: 'Very High', speed: 'Slower', isRateLimited: false }
    ]);
    const contentHtml = ref("");
    const contentData = ref(null);
    const errorMessage = ref("");
    const showRating = ref(false);
    const showAuthModal = ref(false);
    const router = useRouter();
    const contentType = ref('resume'); // Default content type

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
      contentHtml.value = "";
      contentData.value = null;
      showRating.value = false;
    };

    const handleGenerateContent = async (data) => {
      const currentUser = auth.currentUser;
      errorMessage.value = "";

      if (!currentUser) {
        showAuthModal.value = true;
        return;
      }

      const userId = currentUser.uid;

      //CHECK USER RATE LIMIT
      if (!(await canGenerateResume(userId))) {
        errorMessage.value = "You have reached the daily limit of 1 content generation. Please try again tomorrow.";
        return;
      }

      //CHECK MODEL RATE LIMIT
      if (await checkModelRateLimit(selectedModel.value)) {
        errorMessage.value = "This model is currently rate-limited.  Please select a different model or try again later.";
        return; // Prevent generation
      }
      isLoading.value = true;
      contentHtml.value = "";
      contentData.value = null;
      showRating.value = false;

      try {
        const generated = await generateContent(data.formData, data.selectedTemplate, selectedModel.value, contentType.value);
        contentHtml.value = generated.html;
        contentData.value = data.formData;
        await updateLastGenerationDate(userId);
        showRating.value = true;

      } catch (error) {
        errorMessage.value = error.message;
      } finally {
        isLoading.value = false;
      }
    };

    const hideRatingComponent = () => {
      showRating.value = false;
    };

      const handleContentUpdate = (updatedData) => {
        contentData.value = updatedData;
        // You might want to re-generate the HTML here if you're using Approach 2
        // (inline styles generated by AI) and the user has significantly changed
        // the content structure.  For this example, we're assuming minor edits
        // that don't require re-generation.
    };


    onMounted(async () => {
      try {
        // const rateLimits = await fetchModelRateLimits(); //Not using it for now
      } catch (error) {
        errorMessage.value = error.message;
      }
    });

    return {
      isLoading,
      selectedTemplate,
      selectedModel,
      models,
      contentHtml,
      contentData,
      errorMessage,
      showRating,
      showAuthModal,
      user,
      contentType,
      handleTemplateSelection,
      handleGenerateContent,
      hideRatingComponent,
      handleContentUpdate
    };
  }
};
</script>

<style scoped>
/* ... (Keep your existing styles here, and add any new ones) ... */
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
   /* Adjust model selector for smaller screens */
  .model-options-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on smaller screens */
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
/* Fade-in animation */
/* .fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
} */

/* Slide-in animation */
/* .slide-enter-active, .slide-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
} */
</style>