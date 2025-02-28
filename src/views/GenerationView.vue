// src/views/GenerationView.vue
<template>
    <div class="page-container">
        <!-- Main Content Section -->
        <div class="container">
            <div class="content-generation-section">
                <!-- Mobile Step Indicator -->
                <div class="d-block d-md-none step-indicator mb-3">
                    Step {{ currentStep }} of 4:
                    <span class="current-step-label">
                        {{ ['AI Model', 'Content Type', 'Template', 'Generate'][currentStep - 1] }}
                    </span>
                </div>

                <!-- Desktop Stepper (hide on mobile) -->
                <div class="stepper mb-4 d-none d-md-flex">
                    <div class="step" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">
                        <div class="step-number">1</div>
                        <div class="step-label">AI Model</div>
                    </div>
                    <div class="step-connector"></div>
                    <div class="step" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">
                        <div class="step-number">2</div>
                        <div class="step-label">Content Type</div>
                    </div>
                    <div class="step-connector"></div>
                    <div class="step" :class="{ 'active': currentStep >= 3, 'completed': currentStep > 3 }">
                        <div class="step-number">3</div>
                        <div class="step-label">Template</div>
                    </div>
                    <div class="step-connector"></div>
                    <div class="step" :class="{ 'active': currentStep >= 4, 'completed': currentStep > 4 }">
                        <div class="step-number">4</div>
                        <div class="step-label">Generate</div>
                    </div>
                </div>

                <!-- Model Selection -->
                <div v-if="currentStep === 1" class="step-content">
                    <div class="model-selector-container">
                        <h3 class="section-title mb-4">Choose AI Model</h3>
                        <ModelSelector :models="availableModels" v-model:modelValue="selectedModel" />
                        <div class="d-flex justify-content-end mt-4">
                            <button @click="nextStep" class="btn btn-primary" :disabled="!selectedModel">
                                Next <i class="bi bi-arrow-right ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Content Type Selection -->
                <div v-if="currentStep === 2" class="step-content">
                    <div class="content-type-grid">
                        <div v-for="type in contentTypes" :key="type.id" class="content-type-card"
                            :class="{ 'selected': selectedContentType === type.id }" @click="selectContentType(type.id)">
                            <div class="type-icon">
                                <i :class="type.icon"></i>
                            </div>
                            <h4>{{ type.name }}</h4>
                            <p>{{ type.description }}</p>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-3">
                        <button @click="previousStep" class="btn btn-secondary">
                            <i class="bi bi-arrow-left me-2"></i> Back
                        </button>
                        <button @click="nextStep" class="btn btn-primary" :disabled="!selectedContentType">
                            Next <i class="bi bi-arrow-right ms-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Template Selection -->
                <div v-if="currentStep === 3" class="step-content">
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

                <!-- Content Generation -->
                <div v-if="currentStep === 4" class="step-content">
                    <div class="generation-container">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                            <button @click="handleBackFromGenerate" class="btn btn-outline-secondary">
                                <i class="bi bi-arrow-left me-2"></i> Back
                            </button>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="input-section">

                                    <!-- Display Generation Error Here -->
                                    <div v-if="generationError || apiKeyError || geminiError" class="alert alert-danger"
                                        role="alert">
                                        {{ generationError || apiKeyError || geminiError }}
                                    </div>
                                    <ContentForm :contentType="selectedContentType" :selectedTemplate="selectedTemplate"
                                        @generate-content="handleGenerateContent" @timer-update="incrementTimer" />
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="preview-section">
                                    <h3 class="section-title">Preview</h3>

                                    <!-- Generation Time Tracker - Only show when generating or after generation -->
                                    <div class="mb-3">
                                        <p v-if="isGenerating">Generating content... {{ generationTime.toFixed(1) }}
                                            seconds</p>
                                        <p v-else-if="generatedContent">Generation completed in {{
                                            generationTime.toFixed(2) }}
                                            seconds</p>
                                    </div>

                                    <!-- Editor Toggle -->
                                    <div class="mb-3" v-if="generatedContent">
                                        <button @click="isEditing = !isEditing" class="btn btn-outline-secondary">
                                            {{ isEditing ? 'Exit Editor' : 'Edit Content' }}
                                        </button>
                                    </div>

                                    <div v-if="generatedContent" class="preview-container">
                                        <!-- Use ContentEditor when editing -->
                                        <ContentEditor v-if="isEditing" v-model:contentHtml="editedContent"
                                            :contentType="selectedContentType" @notification="handleNotification" />
                                        <!-- Use ContentPreview when not editing -->
                                        <ContentPreview v-else :contentHtml="displayContent"
                                            :contentType="selectedContentType" :template="selectedTemplate"
                                            :contentData="formInputs" :isGenerating="isGenerating"
                                            @notification="handleNotification" />
                                    </div>
                                    <div v-else-if="isGenerating" class="preview-placeholder loading">
                                        <div class="loading-animation">
                                            <div class="gradient-bar"></div>
                                        </div>
                                        <p>Generating content...</p>
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

        <!-- Rating Dialog -->
        <RatingComponent v-if="showRating" :modelName="selectedModel" @rating-submitted="handleRatingSubmitted"
            @rating-closed="handleRatingClosed" />
    </div>
</template>

<script>
    import { ref, onMounted, watch, computed } from 'vue';
    import TemplateSelector from '@/components/ui/TemplateSelector.vue';
    import ContentPreview from '@/components/content/ContentPreview.vue';
    import RatingComponent from '@/components/ui/RatingComponent.vue';
    import ContentForm from '@/components/content/ContentForm.vue';
    import ModelSelector from '@/components/ui/ModelSelector.vue';
    import ContentEditor from '@/components/content/ContentEditor.vue';
    import { auth } from '@/api/firebase.js';
    import { canGenerateResume } from '@/composables/useFirebase';
    import { generateContent } from '@/utils/generation';
    import { getUserRole, getDeveloperApiKey } from '@/utils/auth';
    import { useDebounce } from '@/composables/useDebounce';
    import { useNotifications } from '@/composables/useNotification';

    export default {
        name: 'GenerationView',
        components: {
            TemplateSelector,
            ContentPreview,
            RatingComponent,
            ContentForm,
            ModelSelector,
            ContentEditor,
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
            const generationError = ref('');
            const apiKeyError = ref('');
            const isEditing = ref(false);  // Track editing state
            const editedContent = ref('');     // Store edited content
            const geminiError = ref(''); //Gemini Error
            const generationTime = ref(0); // Time taken for generation, start at 0
            let timerInterval = null;

            const { showNotification } = useNotifications(); // Use the composable

            const debouncedEditedContent = useDebounce(editedContent, 500);

            // Watch for changes in the *debounced* value and update generatedContent.
            watch(debouncedEditedContent, (newVal) => {
                if (isEditing.value) {
                    generatedContent.value = newVal;
                }
            });

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

            //Initialize and reset formInputs, and selectedContentType
            watch(() => selectedContentType.value, (newContentType) => {
                if (newContentType) {
                    const selectedType = contentTypes.find(type => type.id === newContentType);
                    formInputs.value = {}; // Clear previous form data when content type changes.
                    // Initialize enhance flags
                    const fieldsForType = selectedType ? computed(() => {
                        switch (selectedType.id) {
                            case 'resume':
                                return [
                                    { key: 'summary', enhanceable: true },
                                    { key: 'workExperience', enhanceable: true },
                                    { key: 'education', enhanceable: true },
                                    { key: 'skills', enhanceable: true },
                                ];
                            case 'poster':
                                return [
                                    { key: 'body', enhanceable: true },
                                    { key: 'title', enhanceable: true },
                                ]
                            case 'social-post':
                                return [
                                    { key: 'content', enhanceable: true }
                                ]
                            case 'social-ad-copy':
                                return [
                                    { key: 'callToAction', enhanceable: true },
                                ]
                            case 'email-marketing':
                                return [
                                    { key: 'body', enhanceable: true }
                                ]
                            case 'product-descriptions':
                                return [
                                    { key: 'benefits', enhanceable: true }
                                ]
                            case 'business-proposals':
                                return [
                                    { key: 'projectOverview', enhanceable: true },
                                    { key: 'objectives', enhanceable: true },
                                    { key: 'scopeOfWork', enhanceable: true },
                                ]
                            case 'website-copy':
                                return [
                                    { key: 'keyMessage', enhanceable: true },
                                    { key: 'content', enhanceable: true },
                                    { key: 'callToAction', enhanceable: true }
                                ]
                            case 'press-releases':
                                return [
                                    { key: 'body', enhanceable: true },
                                ]
                            default:
                                return [];
                        }
                    }).value : [];

                    fieldsForType.forEach(field => {
                        if (field.enhanceable) {
                            formInputs.value[`${field.key}Enhance`] = false;
                        }
                    });

                    // Initialize the form with required fields
                    if (newContentType === 'website-copy') {
                        formInputs.value = {
                            pageType: '',
                            targetAudience: '',
                            keyMessage: '',
                            content: '',
                            callToAction: '',
                            keyMessageEnhance: false,
                            contentEnhance: false,
                            callToActionEnhance: false
                        };
                    }

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
                // No need to reset currentStep here, it's handled in nextStep()
            };

            const nextStep = () => {
                if (currentStep.value === 1 && !selectedModel.value) {
                    return; // Prevent moving to step 2 without selecting a Model
                }
                if (currentStep.value === 2 && !selectedContentType.value) {
                    return; // Prevent moving to step 3 without selecting a content type.
                }
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
                isEditing.value = false;
                currentStep.value = 3; // Go back to step 3
            };

            const incrementTimer = () => {
                generationTime.value += 0.1; // Increment by 100ms
            }
            const handleGenerateContent = async (formData) => {
                generationError.value = '';
                geminiError.value = '';
                isGenerating.value = true;
                generationTime.value = 0; // Reset to 0
               // const startTime = Date.now(); // Record start time
                timerInterval = setInterval(incrementTimer, 100);


                const userId = auth.currentUser?.uid;
                formInputs.value = formData.formData;

                try {
                    let userRole = 'guest'; // Default role
                    if (userId) {
                        userRole = await getUserRole(userId);
                    } else if (getDeveloperApiKey()) {
                        userRole = 'developer';
                    }

                    if (userRole !== 'admin' && userRole !== 'developer' && !(await canGenerateResume(userId))
                    ) {
                        throw new Error('Daily generation limit reached or insufficient credits.');
                    }

                    const result = await generateContent(
                        formData.formData,
                        selectedTemplate.value,
                        selectedModel.value,
                        selectedContentType.value
                    );

                    generatedContent.value = result.html;
                    editedContent.value = result.html;
                    showRating.value = true;
                    isEditing.value = false;

                } catch (error) {
                    //generationError.value = error.message;
                    if (error.message === "Please sign in or provide a developer API key.") {
                        geminiError.value = "Please sign in or provide a developer API key."
                    }
                    else {
                        generationError.value = error.message
                    }
                } finally {
                    isGenerating.value = false;
                    //const endTime = Date.now(); // Record end time
                    //generationTime.value = (endTime - startTime) / 1000; //update
                    clearInterval(timerInterval);
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

            // Choose what to display in the preview
            const displayContent = computed(() => {
                return isEditing.value ? editedContent.value : generatedContent.value;
            });

            // Centralized notification handler
            const handleNotification = (notification) => {
                showNotification(notification.message, notification.type);
            };

            const SESSION_STORAGE_KEY = 'generation_data';

            onMounted(() => {
                const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    currentStep.value = data.currentStep || 1;
                    selectedTemplate.value = data.selectedTemplate || '';
                    selectedModel.value = data.selectedModel || '';
                    selectedContentType.value = data.selectedContentType || '';
                    formInputs.value = data.formInputs || {};
                }

                auth.onAuthStateChanged(currentUser => {
                    user.value = currentUser;
                    if (!currentUser) {
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                });
            });

            watch([currentStep, selectedTemplate, selectedModel, selectedContentType, formInputs], () => {
                const dataToSave = {
                    currentStep: currentStep.value,
                    selectedTemplate: selectedTemplate.value,
                    selectedModel: selectedModel.value,
                    selectedContentType: selectedContentType.value,
                    formInputs: formInputs.value,
                };
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
            }, { deep: true });

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
                handleGenerateContent,
                handleRatingSubmitted,
                handleRatingClosed,
                generationError,
                handleBackFromGenerate,
                formattedContentType,
                apiKeyError,
                isEditing,
                editedContent,
                displayContent,
                handleNotification,
                geminiError,
                generationTime
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
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
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
        position: relative;
        /* Add this */
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

    /* Loading animation styles */
    .loading-animation {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--border-radius-md);
        /* Match parent */
        overflow: hidden;
        /* Clip the gradient */
    }

    .gradient-bar {
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, rgba(37, 99, 235, 0.1) 25%, rgba(37, 99, 235, 0.2) 50%, rgba(37, 99, 235, 0.1) 75%);
        background-size: 200% 100%;
        animation: loadingGradient 2s linear infinite;
    }

    @keyframes loadingGradient {
        0% {
            background-position: 200% 0;
        }

        100% {
            background-position: -200% 0;
        }
    }

    .preview-placeholder.loading {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 400px;
        /* Increased height */
        background: var(--background-color);
    }
</style>