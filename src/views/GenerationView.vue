<template>
  <div class="page-container">
     <!-- Main Content Section -->
     <div class="container">
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
           <div class="d-flex justify-content-between mt-3">
             <button @click="previousStep" class="btn btn-secondary">
               <i class="bi bi-arrow-left me-2"></i> Back
             </button>
             <button @click="nextStep" class="btn btn-primary" :disabled="!selectedTemplate">
               Next <i class="bi bi-arrow-right ms-2"></i>
             </button>
           </div>
         </div>
 
         <!-- Model Selection -->
         <div v-if="currentStep === 3" class="step-content">
           <div class="model-selector-container">
             <h3 class="section-title mb-4">Choose AI Model</h3>
             <ModelSelector :models="availableModels" v-model:modelValue="selectedModel" />
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
                  <div class="d-flex justify-content-between align-items-center mb-3">
                 <button @click="handleBackFromGenerate" class="btn btn-outline-secondary">
                   <i class="bi bi-arrow-left me-2"></i> Back
                 </button>
               </div>
                     <!-- Display Generation Error Here -->
                     <div v-if="generationError" class="alert alert-danger" role="alert">
                         {{ generationError }}
                     </div>
                   <ContentForm
                     :contentType="selectedContentType"
                     :selectedTemplate="selectedTemplate"
                     @generate-content="handleGenerateContent"
                    />
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
                       :contentData="formInputs"
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
 import { ref, onMounted, watch, computed } from 'vue';
 import TemplateSelector from '@/components/TemplateSelector.vue';
 import ContentPreview from '@/components/ContentPreview.vue';
 import LoadingSpinner from '@/components/LoadingSpinner.vue';
 import RatingComponent from '@/components/RatingComponent.vue';
 import ContentForm from '@/components/ContentForm.vue';
 import ModelSelector from '@/components/ModelSelector.vue';
 import { auth } from '@/firebase';
 import { canGenerateResume, updateLastGenerationDate } from '@/utils/firebaseUtils';
 import { generateContent } from '@/utils/generation';
 
 
 export default {
   name: 'GenerationView',
   components: {
     TemplateSelector,
     ContentPreview,
     LoadingSpinner,
     RatingComponent,
     ContentForm,
     ModelSelector,
   },
   setup() {
     const user = ref(auth.currentUser);
     const currentStep = ref(1);
     const selectedTemplate = ref('');
     const selectedModel = ref('');
     const selectedContentType = ref('');
     const formInputs = ref({});  // Keep this for compatibility with ContentForm, and for placeholder replacement
     const generatedContent = ref('');
     const isGenerating = ref(false);
     const showRating = ref(false);
     const generationError = ref(''); // Add error ref
 
 
    const contentTypes = [
      {
        id: 'resume',
        name: 'Resume',
        icon: 'bi bi-file-person',
        description: 'Professional resume with customizable sections',
      },
      {
        id: 'social-post',
        name: 'Social Media Post',
        icon: 'bi bi-instagram',
        description: 'Engaging social media content for any platform',
      },
      {
        id: 'poster',
        name: 'Poster',
        icon: 'bi bi-image',
        description: 'Eye-catching posters for events and promotions',
      },
      {
        id: 'email-marketing',
        name: 'Email Marketing',
        icon: 'bi bi-envelope',
        description: 'Create effective email marketing content.',
      },
      {
        id: 'product-descriptions',
        name: 'Product Descriptions',
        icon: 'bi bi-box',
        description: 'Craft compelling descriptions for your products.',
      },
      {
        id: 'social-ad-copy',
        name: 'Social Media Ad Copy',
        icon: 'bi bi-badge-ad',
        description: 'Write short, persuasive text for your social media ads.',
      },
      {
        id: 'business-proposals',
        name: 'Business Proposals',
        icon: 'bi bi-briefcase',
        description: 'Create detailed and professional business proposals.',
      },
      {
        id: 'website-copy',
        name: 'Website Copy',
        icon: 'bi bi-globe',
        description: 'Generate compelling content for various website pages.',
      },
      {
        id: 'press-releases',
        name: 'Press Releases',
        icon: 'bi bi-newspaper',
        description: 'Craft formal press releases for news and announcements.',
      },
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
 
      //Initialize and reset formInputs
   watch(() => selectedContentType.value, (newContentType) => {
     if (newContentType) {
       const selectedType = contentTypes.find(type => type.id === newContentType);
       formInputs.value = {}; // Clear previous
     }
   }, { immediate: true });
 
     const handleTemplateSelection = (template) => {
       selectedTemplate.value = template;
     };
 
     const selectModel = (modelId) => {
       selectedModel.value = modelId;
     };
 
     const selectContentType = (typeId) => {
       selectedContentType.value = typeId;
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
 
     const handleBackFromGenerate = () => {
       generationError.value = ''; // Clear any generation errors
       generatedContent.value = ''; // Clear generated content
       previousStep();
     };

   const handleGenerateContent = async (formData) => {
    generationError.value = '';
    isGenerating.value = true;
    const userId = auth.currentUser?.uid;

    try {
        if (!userId) throw new Error('User not authenticated');
        if (!(await canGenerateResume(userId))) throw new Error('Daily generation limit reached.');

        const result = await generateContent(
            formData.formData,
            selectedTemplate.value,
            selectedModel.value,
            selectedContentType.value
        );
        generatedContent.value = result.html;
        await updateLastGenerationDate(userId);
        showRating.value = true;

    } catch (error) {
        generationError.value = error.message;
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
 
     const formattedContentType = computed(() => {
       const type = contentTypes.find(t => t.id === selectedContentType.value);
       return type ? type.name : '';
     });

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
       nextStep,
       previousStep,
       handleGenerateContent, // Changed to use new function
       handleRatingSubmitted,
       handleRatingClosed,
       generationError,
       handleBackFromGenerate,
       formattedContentType
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