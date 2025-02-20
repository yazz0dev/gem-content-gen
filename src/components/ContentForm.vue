// src/components/ContentForm.vue (Corrected)
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">{{ formTitle }}</h2>
    <p class="text-muted mb-4">{{ formDescription }}</p>

    <form @submit.prevent="handleSubmit" class="mb-3">
      <div v-for="(field, index) in fields" :key="index" class="mb-3">
        <label :for="field.key" class="form-label">
          {{ field.label }}
          <span v-if="field.required" class="text-danger">*</span>
        </label>

        <!-- Text Input -->
        <input v-if="field.type === 'text'" :type="field.inputType || 'text'" :id="field.key"
               v-model="formData[field.key]" :required="field.required" class="form-control"
               @input="validateField(field.key)">

        <!-- Textarea -->
        <textarea v-else-if="field.type === 'textarea'" :id="field.key" v-model="formData[field.key]"
                  :required="field.required" :rows="field.rows || 3" class="form-control"
                  @input="validateField(field.key)"></textarea>

        <!-- List Input (like skills) -->
        <div v-else-if="field.type === 'list'" class="input-group">
          <input type="text" v-model="newListValue" @keyup.enter="addListItem(field.key)"
                 :placeholder="field.placeholder" class="form-control">
          <button type="button" @click="addListItem(field.key)" class="btn btn-outline-secondary">Add</button>
          <div class="mt-2">
            <span v-for="(item, itemIndex) in formData[field.key]" :key="`${field.key}-${itemIndex}`"
                  class="badge bg-secondary me-2">
              {{ item }}
              <button type="button" @click="removeListItem(field.key, itemIndex)" class="btn-close"
                      aria-label="Remove item"></button>
            </span>
          </div>
        </div>
        <p v-if="errors[field.key]" class="text-danger mt-1 small">{{ errors[field.key] }}</p>
      </div>

      <!-- General Instructions (Optional) -->
      <div class="mb-3" v-if="showInstructions">
        <label for="instructions" class="form-label">Additional Instructions (Optional)</label>
        <textarea id="instructions" v-model="instructions" rows="3" class="form-control"></textarea>
      </div>

      <button type="submit" class="btn btn-primary w-100">Generate</button>
    </form>
  </div>
</template>

<script>
import { reactive, ref, computed, watch } from 'vue';
import { validateContentForm, validateField as validateSingleField } from '@/utils/validation';

export default {
  name: 'ContentForm',
  props: {
    contentType: {
      type: String,
      required: true,
    },
    selectedTemplate: { // Keep selectedTemplate
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const formData = reactive({});
    const errors = reactive({});
    const newListValue = ref('');
    const instructions = ref('');  // For general instructions
    const showInstructions = ref(false);

    const formTitle = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Resume Information';
        case 'poster': return 'Poster Content';
        case 'social': return 'Social Media Post Details';
        case 'custom': return 'Custom HTML Content';
        default: return 'Content Information';
      }
    });

    const formDescription = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Fill in the details below to generate your resume.';
        case 'poster': return 'Enter the text and details for your poster.';
        case 'social': return 'Provide the content and any specifics for your social media post.';
        case 'custom': return 'Enter your desired HTML content (advanced).';
        default: return 'Provide the necessary information.';
      }
    });

      // Define the form fields for each content type
    const fields = computed(() => {
      switch (props.contentType) {
        case 'resume':
          return [
            { key: 'name', label: 'Full Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'text', inputType: 'email', required: true },
            { key: 'phone', label: 'Phone Number', type: 'text', inputType: 'tel' },
            { key: 'linkedin', label: 'LinkedIn Profile (URL)', type: 'text', inputType: 'url' },
            { key: 'github', label: 'GitHub Profile (URL)', type: 'text', inputType: 'url' },
            { key: 'summary', label: 'Summary', type: 'textarea', required: true },
            { key: 'workExperience', label: 'Work Experience', type: 'list', placeholder: 'Company, Title, Dates, Responsibilities' },
            { key: 'education', label: 'Education', type: 'list', placeholder: 'Institution, Degree, Dates' },
            { key: 'skills', label: 'Skills', type: 'list', placeholder: 'Add a skill' },
          ];
        case 'poster':
          return [
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'subtitle', label: 'Subtitle', type: 'text' },
            { key: 'body', label: 'Body Text', type: 'textarea', required: true },
            { key: 'callToAction', label: 'Call to Action', type: 'text' },
            { key: 'contactInfo', label: 'Contact Information', type: 'text' },
          ];
        case 'social':
          return [
            { key: 'platform', label: 'Platform', type: 'text', required: true, placeholder: 'e.g., Twitter, Instagram, LinkedIn' },
            { key: 'content', label: 'Post Content', type: 'textarea', required: true },
            { key: 'hashtags', label: 'Hashtags', type: 'list', placeholder: 'Add a hashtag' },
            { key: 'mentions', label: 'Mentions', type: 'list', placeholder: 'Add a mention' },
          ];
          case 'custom':
            return [
               { key: 'html', label: 'HTML Content', type: 'textarea', required: true, rows: 10 },
            ];

        default:
          return [];
      }
    });

      // Initialize formData based on fields, *and* set showInstructions
    watch(() => props.contentType, (newContentType) => {
        Object.keys(formData).forEach(key => delete formData[key]); //Clear
        fields.value.forEach(field => {
            if (field.type === 'list') {
              formData[field.key] = [];
            } else {
              formData[field.key] = ''; // Initialize to empty string
            }
        });

        // Set showInstructions based on content type
        showInstructions.value = ['resume', 'poster', 'social'].includes(newContentType);

    }, { immediate: true });

    const addListItem = (fieldKey) => {
      if (newListValue.value.trim() !== '') {
        formData[fieldKey].push(newListValue.value.trim());
        newListValue.value = '';
      }
    };

    const removeListItem = (fieldKey, index) => {
      formData[fieldKey].splice(index, 1);
    };

    const validateForm = () => {
      Object.keys(errors).forEach(key => delete errors[key]); // Clear
      const validationErrors = validateContentForm(formData, props.contentType); // Pass contentType
      Object.assign(errors, validationErrors);
      return Object.keys(errors).length === 0;
    };

    const validateField = (fieldKey) => {
        const validationError = validateSingleField(fieldKey, formData[fieldKey], formData);
        if(validationError){
          errors[fieldKey] = validationError;
        } else {
          delete errors[fieldKey];
        }
    };

    const handleSubmit = () => {
      if (validateForm()) {
        emit('generate-content', {
           formData: { ...formData, instructions: instructions.value },  // Include instructions
          selectedTemplate: props.selectedTemplate,
        });
      }
    };

    return {
      formData,
      errors,
      newListValue,
      instructions,
      showInstructions,
      formTitle,
      formDescription,
      fields,
      addListItem,
      removeListItem,
      handleSubmit,
      validateField,
    };
  }
};
</script>