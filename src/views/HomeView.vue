<template>
  <div class="page-container">
    <!-- Hero Section -->
    <div class="hero-section mb-5" v-if="!user">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h1 class="hero-title">Create Professional Content Instantly</h1>
            <p class="hero-description">Generate high-quality resumes and cover letters using advanced AI models.</p>
            <button @click="$router.push('/auth')" class="cta-button">
              Get Started
            </button>
          </div>
          <div class="col-md-6">
            <!-- Add illustration or image here -->
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="container" v-if="user">
      <div class="content-generation-section">
        <!-- Mobile Step Indicator -->
        <div class="d-block d-md-none step-indicator mb-3">
          Step {{ currentStep }} of 4: 
          <span class="current-step-label">
            {{ ['Content Type', 'Template', 'AI Model', 'Generate'][currentStep - 1] }}
          </span>
        </div>

        <!-- Desktop Stepper (hide on mobile) -->
        <div class="stepper mb-4 d-none d-md-flex">
          <div class="step" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">
            <div class="step-number">1</div>
            <div class="step-label">Content Type</div>
          </div>
          <div class="step-connector"></div>
          <div class="step" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">
            <div class="step-number">2</div>
            <div class="step-label">Template</div>
          </div>
          <div class="step-connector"></div>
          <div class="step" :class="{ 'active': currentStep >= 3, 'completed': currentStep > 3 }">
            <div class="step-number">3</div>
            <div class="step-label">AI Model</div>
          </div>
          <div class="step-connector"></div>
          <div class="step" :class="{ 'active': currentStep >= 4, 'completed': currentStep > 4 }">
            <div class="step-number">4</div>
            <div class="step-label">Generate</div>
          </div>
        </div>

        <!-- Content Type Selection -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="content-type-grid">
            <div v-for="type in contentTypes" 
                 :key="type.id"
                 class="content-type-card"
                 :class="{ 'selected': selectedContentType === type.id }"
                 @click="selectContentType(type.id)">
              <div class="type-icon">
                <i :class="type.icon"></i>
              </div>
              <h4>{{ type.name }}</h4>
              <p>{{ type.description }}</p>
            </div>
          </div>
          <div class="d-flex justify-content-end mt-3">
            <button @click="nextStep" class="btn btn-primary" :disabled="!selectedContentType">
              Next <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>

        <!-- Template Selection -->
        <div v-if="currentStep === 2" class="step-content">
          <TemplateSelector @template-selected="handleTemplateSelection" />
          <div class="d-flex justify-content-end mt-3">
            <button @click="nextStep" class="btn btn-primary" :disabled="!selectedTemplate">
              Next <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>

        <!-- Model Selection -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="model-selector-container">
            <h3 class="section-title">Choose AI Model</h3>
            <div class="model-grid">
              <div v-for="model in availableModels" 
                   :key="model.id"
                   class="model-card"
                   :class="{ 'selected': selectedModel === model.id }"
                   @click="selectModel(model.id)">
                <div class="model-icon">
                  <i :class="model.icon"></i>
                </div>
                <h4>{{ model.name }}</h4>
                <p>{{ model.description }}</p>
                <div class="model-stats">
                  <span><i class="bi bi-award"></i> {{ model.quality }}</span>
                  <span><i class="bi bi-lightning-fill"></i> {{ model.speed }}</span>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-between mt-4">
              <button @click="previousStep" class="btn btn-secondary">
                <i class="bi bi-arrow-left me-2"></i> Back
              </button>
              <button @click="nextStep" class="btn btn-primary" :disabled="!selectedModel">
                Next <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Content Generation -->
        <div v-if="currentStep === 4" class="step-content">
          <div class="generation-container">
            <div class="row">
              <div class="col-md-6">
                <div class="input-section">
                  <h3 class="section-title">{{ selectedContentType }} Details</h3>
                  <form class="mb-3">
                    <div v-for="field in contentTypes.find(t => t.id === selectedContentType)?.fields"
                         :key="field.name"
                         class="mb-3">
                      <label :for="field.name" class="form-label">{{ field.label }}</label>
                      
                      <textarea v-if="field.type === 'textarea'"
                        :id="field.name"
                        v-model="formInputs[field.name]"
                        class="form-control"
                        rows="3"
                        :required="field.required"
                      ></textarea>

                      <select v-else-if="field.type === 'select'"
                        :id="field.name"
                        v-model="formInputs[field.name]"
                        class="form-select"
                        :required="field.required"
                      >
                        <option value="">Select {{ field.label }}</option>
                        <option v-for="option in field.options"
                                :key="option"
                                :value="option">
                          {{ option }}
                        </option>
                      </select>

                      <input v-else
                        :type="field.type"
                        :id="field.name"
                        v-model="formInputs[field.name]"
                        class="form-control"
                        :required="field.required"
                      />
                    </div>
                  </form>
                  <div class="d-flex justify-content-between">
                    <button @click="previousStep" class="btn btn-secondary">
                      <i class="bi bi-arrow-left me-2"></i> Back
                    </button>
                    <button 
                      @click="generateContent" 
                      class="btn btn-primary"
                      :disabled="isGenerating || !validateForm()"
                    >
                      <span v-if="!isGenerating">
                        <i class="bi bi-magic me-2"></i> Generate
                      </span>
                      <span v-else>
                        <i class="bi bi-arrow-repeat spin me-2"></i> Generating...
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="preview-section">
                  <h3 class="section-title">Preview</h3>
                  <div v-if="generatedContent" class="preview-container">
                    <ContentPreview 
                      :contentHtml="generatedContent"
                      :contentType="selectedContentType"
                      :template="selectedTemplate"
                    />
                  </div>
                  <div v-else class="preview-placeholder">
                    <i class="bi bi-file-earmark-text"></i>
                    <p>Generated content will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isGenerating" class="loading-overlay">
      <LoadingSpinner :loading="true" />
    </div>

    <!-- Rating Dialog -->
    <RatingComponent 
      v-if="showRating"
      :modelName="selectedModel"
      @rating-submitted="handleRatingSubmitted"
      @rating-closed="handleRatingClosed"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import TemplateSelector from '@/components/TemplateSelector.vue';
import ContentPreview from '@/components/ContentPreview.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import RatingComponent from '@/components/RatingComponent.vue';
import { auth } from '@/firebase';
import { canGenerateResume, updateLastGenerationDate } from '@/utils/firebaseUtils';

export default {
  name: 'HomeView',
  components: {
    TemplateSelector,
    ContentPreview,
    LoadingSpinner,
    RatingComponent
  },
  setup() {
    const user = ref(auth.currentUser);
    const currentStep = ref(1);
    const selectedTemplate = ref('');
    const selectedModel = ref('');
    const selectedContentType = ref('');
    const formInputs = ref({});
    const generatedContent = ref('');
    const isGenerating = ref(false);
    const showRating = ref(false);

    const contentTypes = [
      {
        id: 'resume',
        name: 'Resume',
        icon: 'bi bi-file-person',
        description: 'Professional resume with customizable sections',
        fields: [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
          { name: 'education', label: 'Education', type: 'textarea', required: true },
          { name: 'experience', label: 'Work Experience', type: 'textarea', required: true },
          { name: 'skills', label: 'Skills', type: 'textarea', required: true }
        ]
      },
      {
        id: 'social-post',
        name: 'Social Media Post',
        icon: 'bi bi-instagram',
        description: 'Engaging social media content for any platform',
        fields: [
          { name: 'platform', label: 'Platform', type: 'select', required: true, 
            options: ['Instagram', 'LinkedIn', 'Twitter', 'Facebook'] },
          { name: 'topic', label: 'Topic', type: 'text', required: true },
          { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
          { name: 'tone', label: 'Tone', type: 'select', required: true,
            options: ['Professional', 'Casual', 'Friendly', 'Humorous'] },
          { name: 'keyPoints', label: 'Key Points', type: 'textarea', required: true },
          { name: 'callToAction', label: 'Call to Action', type: 'text', required: true }
        ]
      },
      {
        id: 'poster',
        name: 'Poster',
        icon: 'bi bi-image',
        description: 'Eye-catching posters for events and promotions',
        fields: [
          { name: 'eventName', label: 'Event/Product Name', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: false },
          { name: 'venue', label: 'Venue/Location', type: 'text', required: false },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'theme', label: 'Theme/Style', type: 'select', required: true,
            options: ['Modern', 'Classic', 'Minimalist', 'Bold'] },
          { name: 'contactInfo', label: 'Contact Information', type: 'textarea', required: true }
        ]
      }
    ];

    const availableModels = [
      {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro',
        description: 'Most advanced model with highest quality output',
        icon: 'bi bi-stars',
        rating: 4.9,
        speed: 'Slower',
        quality: 'Very High'
      },
      {
        id: 'gemini-2.0-flash-thinking-exp-01-21',
        name: 'Gemini 2.0 Flash Thinking',
        description: 'Balanced performance with high quality results',
        icon: 'bi bi-lightning-charge',
        rating: 4.7,
        speed: 'Moderate',
        quality: 'High'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Fast generation with good quality',
        icon: 'bi bi-lightning',
        rating: 4.5,
        speed: 'Fast',
        quality: 'Moderate'
      },
      {
        id: 'gemini-2.0-flash-lite-preview-02-05',
        name: 'Gemini 2.0 Flash-Lite',
        description: 'Fastest generation for simpler tasks',
        icon: 'bi bi-lightning-fill',
        rating: 4.3,
        speed: 'Fast',
        quality: 'Moderate'
      }
    ];

    const handleTemplateSelection = (template) => {
      selectedTemplate.value = template;
    };

    const selectModel = (modelId) => {
      selectedModel.value = modelId;
    };

    const selectContentType = (typeId) => {
      selectedContentType.value = typeId;
      // Initialize form inputs based on content type
      formInputs.value = {};
      const selectedType = contentTypes.find(type => type.id === typeId);
      selectedType.fields.forEach(field => {
        formInputs.value[field.name] = '';
      });
    };

    const validateForm = () => {
      const selectedType = contentTypes.find(type => type.id === selectedContentType.value);
      return selectedType.fields.every(field => {
        return !field.required || formInputs.value[field.name];
      });
    };

    const nextStep = () => {
      if (currentStep.value < 4) {
        currentStep.value++;
      }
    };

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const generateContent = async () => {
      if (!validateForm() || isGenerating.value) return;

      isGenerating.value = true;
      const userId = auth.currentUser?.uid;

      try {
        if (!userId || !(await canGenerateResume(userId))) {
          throw new Error('Daily generation limit reached. Please try again tomorrow.');
        }

        // Format the prompt based on content type and inputs
        const contentTypeData = contentTypes.find(type => type.id === selectedContentType.value);
        const prompt = {
          type: selectedContentType.value,
          template: selectedTemplate.value,
          data: formInputs.value
        };

        // Simulate API call with timeout - Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Example generated content - replace with actual API response
        generatedContent.value = `
          <div class="generated-${selectedContentType.value}">
            <h1>${formInputs.value.eventName || formInputs.value.fullName}</h1>
            <!-- Generated content will go here -->
          </div>
        `;

        await updateLastGenerationDate(userId);
        showRating.value = true;
      } catch (error) {
        console.error('Generation error:', error);
        alert(error.message);
      } finally {
        isGenerating.value = false;
      }
    };

    const handleRatingSubmitted = () => {
      showRating.value = false;
      // Optional: Add success message or additional actions
    };

    const handleRatingClosed = () => {
      showRating.value = false;
    };

    onMounted(() => {
      // Add any initialization logic here
    });

    return {
      user,
      currentStep,
      selectedTemplate,
      selectedModel,
      selectedContentType,
      formInputs,
      generatedContent,
      isGenerating,
      showRating,
      contentTypes,
      availableModels,
      handleTemplateSelection,
      selectModel,
      selectContentType,
      validateForm,
      nextStep,
      previousStep,
      generateContent,
      handleRatingSubmitted,
      handleRatingClosed
    };
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--background-color);
}

.content-generation-section {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 2rem;
}

/* Stepper Styles */
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2rem 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.step.active .step-number {
  background: var(--primary-color);
}

.step.completed .step-number {
  background: var(--success-color);
}

.step-connector {
  flex: 1;
  height: 2px;
  background: var(--secondary-color);
  margin: 0 1rem;
  margin-bottom: 2rem;
}

/* Model Selection Styles */
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.model-card {
  background: white;
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.model-card.selected {
  border-color: var(--primary-color);
  background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
}

.model-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.model-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.model-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.model-stats i {
  font-size: 1rem;
}

/* Animation for loading spinner */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Preview Placeholder */
.preview-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--background-color);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
}

.preview-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.content-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.content-type-card {
  background: white;
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.content-type-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.content-type-card.selected {
  border-color: var(--primary-color);
  background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
}

.type-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Mobile Step Indicator */
.step-indicator {
  background: var(--surface-color);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.current-step-label {
  color: var(--primary-color);
  font-weight: 600;
}

/* Responsive Form Controls */
@media (max-width: 767px) {
  .generation-container {
    padding: 1rem;
  }

  .input-section,
  .preview-section {
    padding: 1rem;
  }

  .model-card,
  .content-type-card {
    padding: 1rem;
  }

  .btn-group {
    width: 100%;
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    flex: 1;
  }
}

/* Improved Card Layouts */
@media (min-width: 768px) {
  .model-grid,
  .content-type-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

/* Touch-friendly Adjustments */
@media (hover: none) {
  .model-card,
  .content-type-card {
    padding: 1.25rem;
  }

  .type-icon {
    font-size: 2rem;
  }
}
</style>