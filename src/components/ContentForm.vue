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
        <Field v-if="field.type === 'text'" :type="field.inputType || 'text'" :id="field.key"
               :name="field.key"  class="form-control"  />

        <!-- Textarea -->
        <Field v-else-if="field.type === 'textarea'" :id="field.key" :name="field.key"
                  :rows="field.rows || 3" class="form-control"  />

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
import { Form as VForm, Field, ErrorMessage } from 'vee-validate'; // Rename Form to VForm
import * as yup from 'yup'; // Import Yup


export default {
  name: 'ContentForm',
  components: {
    VForm, // Use VForm here
    Field,
    ErrorMessage
  },
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
    const formData = reactive({}); // Keep formData for list input compatibility
    const newListValue = ref('');
    const instructions = ref('');  // For general instructions
    const showInstructions = ref(false);
    const formSchema = ref(null); // Dynamic schema

      const formTitle = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Resume Information';
        case 'poster': return 'Poster Content';
        case 'social-post': return 'Social Media Post Details'; // Corrected hyphen
        case 'cover-letter': return 'Cover Letter Details';
        case 'linkedin-about': return 'LinkedIn About Details';
        case 'blog-ideas': return 'Blog Post Ideas';
        case 'social-ad-copy': return 'Social Media Ad Copy';
        case 'email-marketing': return 'Email Marketing Details';
        case 'website-headlines': return 'Website Headline Details';
        case 'product-descriptions': return 'Product Description Details';
        case 'youtube-content': return 'YouTube Content Details';
        default: return 'Content Information';
      }
    });

    const formDescription = computed(() => {
      switch (props.contentType) {
        case 'resume': return 'Fill in the details below to generate your resume.';
        case 'poster': return 'Enter the text and details for your poster.';
        case 'social-post': return 'Provide the content and any specifics for your social media post.'; // Corrected
        case 'cover-letter': return 'Enter the details for your cover letter.';
        case 'linkedin-about': return 'Fill in the details for your LinkedIn About section.';
        case 'blog-ideas': return 'Provide the topic and details for your blog post ideas.';
        case 'social-ad-copy': return 'Provide the details for your social media ad copy.';
        case 'email-marketing': return 'Fill in the details for your email marketing campaign.';
        case 'website-headlines': return 'Provide the information for your website headlines.';
        case 'product-descriptions': return 'Enter the details for your product descriptions.';
        case 'youtube-content': return 'Fill in the details for your YouTube content.';

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
        case 'social-post':
          return [
            { key: 'platform', label: 'Platform', type: 'text', required: true, placeholder: 'e.g., Twitter, Instagram, LinkedIn' },
            { key: 'content', label: 'Post Content', type: 'textarea', required: true },
            { key: 'hashtags', label: 'Hashtags', type: 'list', placeholder: 'Add a hashtag' },
            { key: 'mentions', label: 'Mentions', type: 'list', placeholder: 'Add a mention' },
          ];
        case 'cover-letter':
          return [
            { key: 'companyName', label: 'Company Name', type: 'text', required: true },
            { key: 'jobTitle', label: 'Job Title', type: 'text', required: true },
            { key: 'hiringManager', label: 'Hiring Manager Name (optional)', type: 'text' },
            { key: 'introduction', label: 'Introduction Paragraph', type: 'textarea', required: true },
            { key: 'body', label: 'Body Paragraphs', type: 'textarea', required: true },
            { key: 'conclusion', label: 'Conclusion Paragraph', type: 'textarea', required: true },
          ];
        case 'linkedin-about':
          return [
            { key: 'headline', label: 'Headline', type: 'text', required: true },
            { key: 'summary', label: 'Summary', type: 'textarea', required: true },
            { key: 'keywords', label: 'Keywords (comma-separated)', type: 'text', required: true },
            { key: 'experienceHighlights', label: 'Experience Highlights', type: 'textarea', required: true },

          ];
        case  'blog-ideas':
            return [
              { key: 'topic', label: 'Topic', type: 'text', required: true },
              { key: 'keywords', label: 'Keywords (comma-separated)', type: 'text', required: true },
              { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
              { key: 'angle', label: 'Angle/Perspective', type: 'text', required: true },
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
              { key: 'body', label: 'Body Content', type: 'textarea', required: true },
              { key: 'callToAction', label: 'Call to Action', type: 'text', required: true },
            ];
          case 'website-headlines':
           return [
              { key: 'pageType', label: 'Page Type', type: 'select', required: true, options: ['Landing Page', 'Product Page', 'Blog Page'] },
              { key: 'productOrService', label: 'Product/Service', type: 'text', required: true },
              { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
              { key: 'keyBenefit', label: 'Key Benefit/Value Proposition', type: 'text', required: true },
          ];
         case 'product-descriptions':
          return [
              { key: 'productName', label: 'Product Name', type: 'text', required: true },
              { key: 'keyFeatures', label: 'Key Features (comma-separated)', type: 'text', required: true },
              { key: 'benefits', label: 'Benefits', type: 'textarea', required: true },
              { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
          ];
          case 'youtube-content':
            return [
              { key: 'videoTopic', label: 'Video Topic', type: 'text', required: true },
              { key: 'keywords', label: 'Keywords (comma-separated)', type: 'text', required: true },
              { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
              { key: 'keyPoints', label: 'Key Points (for Description)', type: 'textarea', required: true },
            ];

        default:
          return [];
      }
    });

       // Initialize formData and formSchema
    watch(() => props.contentType, (newContentType) => {
      // Clear existing formData
      Object.keys(formData).forEach(key => delete formData[key]);

      // Create a new schema based on the fields
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
        schema[field.key] = fieldSchema;

      });
      formSchema.value = yup.object().shape(schema);
      showInstructions.value = ['resume', 'poster', 'social-post', 'cover-letter'].includes(newContentType);

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


    const handleSubmit = async (values) => { // Receive validated values
       // Map VeeValidate values to formData (for list inputs)
        Object.keys(values).forEach(key => {
            // Only update formData if it's not a list (list is handled separately)
            if (!Array.isArray(formData[key])) {
              formData[key] = values[key];
            }
        });

        // Include instructions
        const dataToSend = {
          formData: { ...formData, instructions: instructions.value },
          selectedTemplate: props.selectedTemplate,
        };

        emit('generate-content', dataToSend);
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