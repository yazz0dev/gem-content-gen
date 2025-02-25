<!-- src/components/ContentForm.vue -->
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">{{ formTitle }}</h2>
    <p class="text-muted mb-4">{{ formDescription }}</p>

    <VForm @submit="handleSubmit" :validation-schema="formSchema" class="mb-3">
      <div v-for="(field, index) in fields" :key="index" class="mb-3">
        <label :for="field.key" class="form-label">
          {{ field.label }}
          <span v-if="field.required" class="text-danger">*</span>
        </label>

        <!-- Text Input -->
        <div v-if="field.type === 'text'" class="d-flex align-items-start">
          <Field :type="field.inputType || 'text'" :id="field.key"
                 :name="field.key"  class="form-control flex-grow-1"  />
          <template v-if="field.enhanceable">
            <div class="form-check ms-3">
                <input type="checkbox" :id="`${field.key}-enhance`" v-model="formData[`${field.key}Enhance`]" class="form-check-input">
                <label :for="`${field.key}-enhance`" class="form-check-label small">AI Enhance</label>
            </div>
          </template>
        </div>
        <!-- Textarea -->
        <div v-else-if="field.type === 'textarea'" class="d-flex align-items-start">
          <Field :id="field.key" :name="field.key"
                 :rows="field.rows || 3" class="form-control flex-grow-1"  />
           <template v-if="field.enhanceable">
            <div class="form-check ms-3">
                <input type="checkbox" :id="`${field.key}-enhance`" v-model="formData[`${field.key}Enhance`]" class="form-check-input">
                <label :for="`${field.key}-enhance`" class="form-check-label small">AI Enhance</label>
            </div>
          </template>
        </div>

        <!-- Select Input -->
        <div v-else-if="field.type === 'select'" class="form-floating">
          <Field as="select" :id="field.key" :name="field.key" class="form-select">
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option }}
            </option>
          </Field>
          <label :for="field.key">{{ field.label }}</label>
        </div>

        <!-- List Input (like skills) -->
        <div v-else-if="field.type === 'list'" class="input-group">
           <input type="text" v-model="newListValue" @keyup.enter="addListItem(field.key)"
                 :placeholder="field.placeholder" class="form-control" :aria-describedby="`${field.key}-add-btn`">
          <button type="button" @click="addListItem(field.key)" class="btn btn-outline-secondary" :id="`${field.key}-add-btn`">Add</button>
          <div class="mt-2">
            <span v-for="(item, itemIndex) in formData[field.key]" :key="`${field.key}-${itemIndex}`"
                  class="badge bg-secondary me-2">
              {{ item }}
              <button type="button" @click="removeListItem(field.key, itemIndex)" class="btn-close"
                      aria-label="Remove item"></button>
            </span>
          </div>
           <template v-if="field.enhanceable">
            <div class="form-check mt-2">
              <input type="checkbox" :id="`${field.key}-enhance`" v-model="formData[`${field.key}Enhance`]" class="form-check-input">
              <label :for="`${field.key}-enhance`" class="form-check-label small">AI Enhance</label>
            </div>
          </template>
        </div>

        <ErrorMessage :name="field.key" class="text-danger mt-1 small" />
      </div>

      <!-- General Instructions (Optional) -->
      <div class="mb-3" v-if="showInstructions">
        <label for="instructions" class="form-label">Additional Instructions (Optional)</label>
        <textarea id="instructions" v-model="instructions" rows="3" class="form-control"></textarea>
      </div>

      <button type="submit" class="btn btn-primary w-100">Generate</button>
    </VForm>
  </div>
</template>

<script>
import { reactive, ref, computed, watch } from 'vue';
import { Form as VForm, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';


export default {
  name: 'ContentForm',
  components: {
    VForm,
    Field,
    ErrorMessage
  },
  props: {
    contentType: {
      type: String,
      required: true,
    },
    selectedTemplate: {
      type: String,
      required: true,
    },
  },
  emits: ['generate-content'],
  setup(props, { emit }) {
    const formData = reactive({});
    const newListValue = ref('');
    const instructions = ref('');
    const showInstructions = ref(false);
    const formSchema = ref(null);

      const formTitle = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Resume Information';
        case 'poster': return 'Poster Content';
        case 'social-post': return 'Social Media Post Details'; // Corrected hyphen
        //case 'cover-letter': return 'Cover Letter Details'; // Removed
        //case 'linkedin-about': return 'LinkedIn About Details'; // Removed
        //case 'blog-ideas': return 'Blog Post Ideas'; // Removed
        case 'social-ad-copy': return 'Social Media Ad Copy';
        case 'email-marketing': return 'Email Marketing Details';
        //case 'website-headlines': return 'Website Headline Details'; // Removed
        case 'product-descriptions': return 'Product Description Details';
        //case 'youtube-content': return 'YouTube Content Details'; // Removed
        case 'business-proposals': return 'Business Proposal Details'; //Added
        case 'website-copy': return 'Website Copy Details'; // Added
        case 'press-releases': return 'Press Release Details';// Added
        default: return 'Content Information';
      }
    });

    const formDescription = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Fill in the details below to generate your resume.';
        case 'poster': return 'Enter the text and details for your poster.';
        case 'social-post': return 'Provide the content and any specifics for your social media post.';
        case 'social-ad-copy': return 'Provide the details for your social media ad copy.';
        case 'email-marketing': return 'Fill in the details for your email marketing campaign.';
        case 'product-descriptions': return 'Enter the details for your product descriptions.';
        case 'business-proposals': return 'Enter the details for your Business Proposal.'; // Added
        case 'website-copy': return 'Fill in the details for your Website Copy.';// Added
        case 'press-releases': return 'Fill in the details for your Press Release.'; // Added

        default: return 'Provide the necessary information.';
      }
    });

      // Define the form fields for each content type
    const fields = computed(() => {
      switch (props.contentType) {
        case 'resume':
          return [
            { key: 'fullName', label: 'Full Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'text', inputType: 'email', required: true },
            { key: 'phone', label: 'Phone Number', type: 'text', inputType: 'tel' },
            { key: 'linkedin', label: 'LinkedIn Profile (URL)', type: 'text', inputType: 'url' },
            { key: 'github', label: 'GitHub Profile (URL)', type: 'text', inputType: 'url' },
            { key: 'summary', label: 'Summary', type: 'textarea', required: true, enhanceable: true },
            { key: 'workExperience', label: 'Work Experience', type: 'list', placeholder: 'Company, Title, Dates, Responsibilities', enhanceable: true },
            { key: 'education', label: 'Education', type: 'list', placeholder: 'Institution, Degree, Dates', enhanceable: true },
            { key: 'skills', label: 'Skills', type: 'list', placeholder: 'Add a skill', enhanceable: true },
          ];
        case 'poster':
          return [
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'subtitle', label: 'Subtitle', type: 'text' },
            { key: 'body', label: 'Body Text', type: 'textarea', required: true, enhanceable: true },
            { key: 'callToAction', label: 'Call to Action', type: 'text' },
            { key: 'contactInfo', label: 'Contact Information', type: 'text' },
          ];
        case 'social-post':
          return [
            { key: 'platform', label: 'Platform', type: 'text', required: true, placeholder: 'e.g., Twitter, Instagram, LinkedIn' },
            { key: 'content', label: 'Post Content', type: 'textarea', required: true, enhanceable: true },
            { key: 'hashtags', label: 'Hashtags', type: 'list', placeholder: 'Add a hashtag' },
            { key: 'mentions', label: 'Mentions', type: 'list', placeholder: 'Add a mention' },
          ];

        case  'social-ad-copy':
          return [
            { key: 'platform', label: 'Platform', type: 'select', required: true,
            options:['Instagram', 'Facebook', 'LinkedIn', 'Twitter']},
            { key: 'product', label: 'Product/Service', type: 'text', required: true },
            { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
            { key: 'keyBenefit', label: 'Key Benefit', type: 'text', required: true },
            { key: 'callToAction', label: 'Call to Action', type: 'text', required: true },
          ];

          case 'email-marketing':
            return [
              { key: 'emailType', label: 'Email Type', type: 'select', required: true, options: ['Newsletter', 'Promotional', 'Transactional'] },
              { key: 'subjectLine', label: 'Subject Line', type: 'text', required: true },
              { key: 'preheader', label: 'Preheader Text', type: 'text' },
              { key: 'body', label: 'Body Content', type: 'textarea', required: true, enhanceable: true },
              { key: 'callToAction', label: 'Call to Action', type: 'text', required: true },
            ];

         case 'product-descriptions':
          return [
              { key: 'productName', label: 'Product Name', type: 'text', required: true },
              { key: 'keyFeatures', label: 'Key Features (comma-separated)', type: 'text', required: true },
              { key: 'benefits', label: 'Benefits', type: 'textarea', required: true, enhanceable: true },
              { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
          ];

           case 'business-proposals': // Added
                return [
                    { key: 'clientName', label: 'Client Name', type: 'text', required: true },
                    { key: 'projectName', label: 'Project Name', type: 'text', required: true },
                    { key: 'projectOverview', label: 'Project Overview', type: 'textarea', required: true, enhanceable: true },
                    { key: 'objectives', label: 'Objectives', type: 'list', placeholder: 'Add an objective', enhanceable: true },
                    { key: 'scopeOfWork', label: 'Scope of Work', type: 'textarea', required: true, enhanceable: true},
                    { key: 'timeline', label: 'Project Timeline', type: 'text' },
                    { key: 'budget', label: 'Budget', type: 'text' },
                ];
            case 'website-copy': // Added
                return [
                    { key: 'pageType', label: 'Page Type', type: 'select', required: true, options: ['Homepage', 'About Us', 'Services', 'Contact Us'] },
                    { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
                    { key: 'keyMessage', label: 'Key Message', type: 'textarea', required: true, enhanceable: true },
                    { key: 'callToAction', label: 'Call to Action', type: 'text' },
                ];
            case 'press-releases': // Added
                return [
                    { key: 'headline', label: 'Headline', type: 'text', required: true },
                    { key: 'companyName', label: 'Company Name', type: 'text', required: true },
                    { key: 'city', label: 'City', type: 'text', required: true },
                    { key: 'state', label: 'State', type: 'text', required: true },
                    { key: 'releaseDate', label: 'Release Date', type: 'text', inputType: 'date' },
                    { key: 'body', label: 'Body Text', type: 'textarea', required: true, enhanceable: true },
                    { key: 'contactName', label: 'Contact Name', type: 'text' },
                    { key: 'contactEmail', label: 'Contact Email', type: 'text', inputType: 'email' },
                    { key: 'contactPhone', label: 'Contact Phone', type: 'text', inputType: 'tel' },
                ];

        default:
          return [];
      }
    });

    // Initialize formData and formSchema
    watch(() => props.contentType, (newContentType) => {
      // Clear existing formData
      Object.keys(formData).forEach(key => delete formData[key]);

      const schema = {};
      fields.value.forEach(field => {
          let fieldSchema = yup.string();
          if (field.required) {
            fieldSchema = fieldSchema.required(`${field.label} is required`);
          }
          if (field.inputType === 'email') {
            fieldSchema = fieldSchema.email('Invalid email format');
          }
           if (field.inputType === 'tel') {
             fieldSchema = fieldSchema.matches(/^\d{10}$/, 'Invalid phone number. Enter a 10-digit number.');
          }
        if (field.type === 'list') {
          formData[field.key] = [];  // Initialize as array
        }  else {
          formData[field.key] = ''; // Initialize other fields
        }
        // Add enhanceable fields
        if(field.enhanceable){
            formData[`${field.key}Enhance`] = false; // Initialize enhance flag
        }
        schema[field.key] = fieldSchema;

      });
      formSchema.value = yup.object().shape(schema);
      showInstructions.value = ['resume', 'poster', 'social-post', 'cover-letter', 'business-proposals', 'press-releases'].includes(newContentType); //added new

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


    const handleSubmit = async (values, { resetForm }) => {
      try {
        // Map VeeValidate values to formData
        Object.keys(values).forEach(key => {
          if (!Array.isArray(formData[key])) {
            formData[key] = values[key];
          }
        });

        const dataToSend = {
          formData: {
            ...formData,
            instructions: instructions.value
          },
          selectedTemplate: props.selectedTemplate,
        };
        await emit('generate-content', dataToSend);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    };

    return {
      formData,
      newListValue,
      instructions,
      showInstructions,
      formSchema,
      formTitle,
      formDescription,
      fields,
      addListItem,
      removeListItem,
      handleSubmit,
    };
  }
};
</script>

<style scoped>
/* Add this to your component's style, or to a global stylesheet */
.input-enhance-group {
  display: flex;
  align-items: center; /* Vertically center the input and checkbox */
}

.input-enhance-group .form-control {
  flex-grow: 1; /* Allow the input to take up remaining space */
  margin-right: 0.5rem; /* Add some space between the input and checkbox */
}
</style>