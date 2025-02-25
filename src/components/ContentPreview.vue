---
File: /src/components/ContentPreview.vue
---

<!-- src/components/ContentPreview.vue -->
<template>
  <div class="content-preview">
    <div class="preview-actions mb-3">
      <button @click="downloadPDF" 
              class="btn btn-primary me-2"
              :disabled="isGenerating"
              aria-label="Download as PDF">
        <i class="bi bi-download me-2"></i>Download PDF
      </button>
      <button @click="copyToClipboard" 
              class="btn btn-secondary"
              :disabled="isGenerating"
              aria-label="Copy HTML content">
        <i class="bi bi-clipboard me-2"></i>Copy HTML
      </button>
    </div>

    <div class="preview-container p-4 bg-white" ref="previewContainer">
      <div :class="templateClass" v-html="finalContent"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import html2pdf from 'html2pdf.js';
import DOMPurify from 'dompurify';

export default {
  name: 'ContentPreview',
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
  setup(props, { emit }) {
    const previewContainer = ref(null);

    const templateClass = computed(() => {
      return `template-${props.template.toLowerCase()}`;
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

    const notify = (message, type = 'success') => {
      // Emit notification event to parent
      emit('notification', { message, type });
    };

    const downloadPDF = async () => {
      const element = previewContainer.value;
      if (!element) return;

      const opt = {
        margin: 1,
        filename: `${props.contentType}-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(element).save();
        notify('PDF downloaded successfully');
      } catch (error) {
        console.error('PDF generation failed:', error);
        notify('Failed to generate PDF. Please try again.', 'error');
      }
    };

    const copyToClipboard = async () => {
      const content = previewContainer.value?.innerHTML;
      if (!content) return;

      try {
        await navigator.clipboard.writeText(content);
        notify('Content copied to clipboard');
      } catch (error) {
        console.error('Copy failed:', error);
        notify('Failed to copy content. Please try again.', 'error');
      }
    };

    return {
      previewContainer,
      templateClass,
      finalContent, // Use the sanitized and placeholder-replaced content
      downloadPDF,
      copyToClipboard
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
</style>