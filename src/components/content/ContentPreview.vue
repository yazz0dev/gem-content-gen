<template>
  <div class="content-preview">
    <DownloadOptions
      :contentHtml="finalContent"
      :contentType="contentType"
      :contentData="contentData"
      :disabled="isGenerating"
      @notification="$emit('notification', $event)"
    />
    
    <div class="preview-container p-4 bg-white" ref="previewContainer">
      <div v-if="contentType === 'social-post'" class="social-post-preview">
        <div class="platform-header">
          <i :class="platformIcon"></i>
          <span>{{ contentData.platform }}</span>
        </div>
        <div class="social-post-content" v-html="finalContent"></div>
      </div>
      <div v-else :class="templateClass" v-html="finalContent"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import DOMPurify from 'dompurify';
import DownloadOptions from '../content/DownloadOptions.vue'; // Import

export default {
  name: 'ContentPreview',
  components: {
    DownloadOptions,
  },
  props: {
    contentHtml: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    template: {
      type: String,
      required: true
    },
    contentData: { // Receive form data
      type: Object,
      default: () => ({})
    },
    isGenerating: {
      type: Boolean,
      default: false
    }
  },
  emits: ['notification'], // Forward notifications
  setup(props) {
    const previewContainer = ref(null);

    const templateClass = computed(() => {
      // Remove business-proposals case and add landing-page
      return `template-${props.template.toLowerCase()}${
        props.contentType === 'landing-page' ? ' landing-preview' : ''
      }`;
    });

    const platformIcon = computed(() => {
      const platform = props.contentData?.platform?.toLowerCase() || '';
      return {
        'bi bi-instagram': platform === 'instagram',
        'bi bi-facebook': platform === 'facebook',
        'bi bi-twitter': platform === 'twitter',
        'bi bi-linkedin': platform === 'linkedin'
      };
    });

    // Replace placeholders *before* sanitizing
    const processedHtml = computed(() => {
      let html = props.contentHtml;
      const data = props.contentData || {};

      if (props.contentType === 'resume') {
        html = html.replace(/\[NAME_PLACEHOLDER\]/g, data.fullName || '');
        html = html.replace(/\[EMAIL_PLACEHOLDER\]/g, data.email || '');
        html = html.replace(/\[PHONE_PLACEHOLDER\]/g, data.phone || '');
        html = html.replace(/\[LINKEDIN_PLACEHOLDER\]/g, data.linkedin || '');
        html = html.replace(/\[GITHUB_PLACEHOLDER\]/g, data.github || '');
      }

      if (props.contentType === 'social-post') {
        // Format hashtags and mentions
        html = html.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
        html = html.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        // Handle line breaks properly for social media
        html = html.replace(/\n{2,}/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = `<p>${html}</p>`;
      }

      if (props.contentType === 'press-releases') {
        html = html.replace(/\[HEADLINE\]/g, data.headline || '');
        html = html.replace(/\[COMPANY_NAME\]/g, data.companyName || '');
        html = html.replace(/\[CITY\]/g, data.city || '');
        html = html.replace(/\[STATE\]/g, data.state || '');
        html = html.replace(/\[RELEASE_DATE\]/g, data.releaseDate || 'FOR IMMEDIATE RELEASE');
        html = html.replace(/\[BODY_CONTENT\]/g, data.body || '');
        html = html.replace(/\[CONTACT_NAME\]/g, data.contactName || 'Media Relations');
        html = html.replace(/\[CONTACT_EMAIL\]/g, data.contactEmail || '');
        html = html.replace(/\[CONTACT_PHONE\]/g, data.contactPhone || '');
      }
      // Add placeholder replacement for other content types as needed

      return html;
    });

    // Sanitize *after* placeholder replacement and *after* conditional logic
    const finalContent = computed(() => {
      // 1. Apply conditional logic (v-if equivalent) *before* sanitization
      let tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedHtml.value;

      // Resume-specific logic
      if (props.contentType === 'resume') {
        const data = props.contentData || {};

        // Helper function to check if a section is empty
        const isEmpty = (selector) => {
          const element = tempDiv.querySelector(selector);
          return !element || element.innerHTML.trim() === '' || element.innerHTML.trim() === 'No work experience listed.'  || element.innerHTML.trim() === 'No education listed.' || element.innerHTML.trim() === 'No skills listed.';
        };
        // Conditionally remove sections if they are empty
        if (isEmpty('.resume-summary') || data.summary === "" || data.summary === null) {
          const summary = tempDiv.querySelector('.resume-summary');
          if(summary) summary.remove();
        }
        if (isEmpty('.work-experience') || !data.workExperience?.length) {
          const workExp = tempDiv.querySelector('.work-experience');
          if(workExp) workExp.remove();
        }
        if (isEmpty('.education-section') || !data.education?.length) {
          const education = tempDiv.querySelector('.education-section');
          if(education) education.remove();
        }
        if (isEmpty('.skills-section') || !data.skills?.length) {
          const skills = tempDiv.querySelector('.skills-section');
          if(skills) skills.remove();
        }

      }
      // Add conditional logic for other content types as needed

      // 2. *Now* sanitize the modified HTML
      return DOMPurify.sanitize(tempDiv.innerHTML);
    });

    return {
      previewContainer,
      templateClass,
      finalContent, // Use the sanitized and placeholder-replaced content
      platformIcon,
    };
  }
};
</script>

<style scoped>
.content-preview {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 500px;
}

.platform-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
  font-weight: 500;
}

.social-post-preview {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.social-post-content {
  padding: 1rem;
  font-size: 1.1rem;
  line-height: 1.5;
}

.social-post-content :deep(.hashtag) {
  color: #1da1f2;
  font-weight: 500;
}

.social-post-content :deep(.mention) {
  color: #1da1f2;
  font-weight: 500;
}

.social-post-content :deep(p) {
  margin-bottom: 1rem;
}

.social-post-content :deep(br) {
  content: "";
  margin: 0.5rem 0;
  display: block;
}

.social-post-preview {
  max-width: 500px;
  margin: 0 auto;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.social-post-content {
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.social-post-meta {
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.hashtags {
  color: #1da1f2;
}

.mentions {
  color: #1da1f2;
  font-weight: 500;
}

.landing-preview {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Press Release Specific Styles */
:deep(.press-release) {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
  font-family: "Times New Roman", Times, serif;
}

:deep(.press-release-header) {
  text-align: center;
  margin-bottom: 2rem;
}

:deep(.press-release-dateline) {
  font-weight: bold;
  margin: 1.5rem 0;
}

:deep(.press-release-body) {
  margin: 2rem 0;
  text-align: justify;
}

:deep(.press-release-contact) {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

:deep(.press-release-boilerplate) {
  font-style: italic;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

/* Content Type Specific Styles */
:deep(.template-modern), :deep(.template-professional), :deep(.template-creative), :deep(.template-minimal) {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

/* Resume Styles */
:deep(.resume-header) {
  text-align: center;
  margin-bottom: 2rem;
}

:deep(.resume-section) {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

:deep(.resume-section:last-child) {
  border-bottom: none;
}

/* Poster Styles */
:deep(.poster-content) {
  text-align: center;
  padding: 2rem;
}

:deep(.poster-title) {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

:deep(.poster-subtitle) {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 2rem;
}

/* Email Marketing Styles */
:deep(.email-marketing) {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

:deep(.email-header) {
  margin-bottom: 2rem;
}

:deep(.email-content) {
  margin-bottom: 2rem;
}

:deep(.email-cta) {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

/* Product Description Styles */
:deep(.product-description) {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

:deep(.product-features) {
  margin: 2rem 0;
  padding-left: 1.5rem;
}

:deep(.product-benefits) {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
}

/* Landing Page Styles */
:deep(.landing-page) {
  max-width: 1200px;
  margin: 0 auto;
}

:deep(.landing-hero) {
  text-align: center;
  padding: 4rem 2rem;
  background: #f8f9fa;
}

:deep(.landing-features) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

/* Website Copy Styles */
:deep(.website-copy) {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

:deep(.website-section) {
  margin-bottom: 3rem;
}

:deep(.website-section:last-child) {
  margin-bottom: 0;
}

/* Template-specific modifiers */
:deep(.template-modern) {
  font-family: 'Arial', sans-serif;
}

:deep(.template-professional) {
  font-family: 'Georgia', serif;
}

:deep(.template-creative) {
  font-family: 'Helvetica', sans-serif;
}

:deep(.template-minimal) {
  font-family: 'Times New Roman', serif;
}
</style>