<!-- src/components/content/ContentEditor.vue -->
<template>
    <div class="content-editor">
      <div ref="editableContent" v-html="editedContent" @input="handleInput"></div>
      <div class="editor-actions mt-2">
        <button @click="saveChanges" class="btn btn-success me-2">Save Changes</button>
        <button @click="cancelChanges" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch } from 'vue';
  import DOMPurify from 'dompurify';
  
  export default {
    name: 'ContentEditor',
    props: {
      contentHtml: {
        type: String,
        required: true
      },
      contentType: { // Needed to identify editable sections
          type: String,
          required: true
      }
    },
    emits: ['update:contentHtml', 'notification'],
    setup(props, { emit }) {
      const editableContent = ref('');
      const originalContent = ref('');
      const editableElements = ref([]);
  
      watch(() => props.contentHtml, (newHtml) => {
         originalContent.value = newHtml; // Store for reverting
          //Parse HTML, Find and make editable elements
          const parser = new DOMParser();
          const doc = parser.parseFromString(newHtml, 'text/html');
  
          //Resume
          if(props.contentType === 'resume'){
              makeElementEditable(doc, '#name');
              makeElementEditable(doc, '.resume-summary p');
              makeElementsEditable(doc, '.experience-item h3');
              makeElementsEditable(doc, '.experience-item p');
              makeElementsEditable(doc, '.education-item h3');
              makeElementsEditable(doc, '.education-item p');
              makeElementsEditable(doc, '.skills-section li');
          }
  
          //Poster
          else if (props.contentType === 'poster') {
              makeElementEditable(doc, '#poster-title');
              makeElementEditable(doc, '#poster-subtitle');
              makeElementEditable(doc, '#poster-body');
              makeElementEditable(doc, '#poster-cta');
              makeElementEditable(doc, '#poster-contact');
          }
          // Social Post
          else if (props.contentType === 'social-post') {
              makeElementEditable(doc, '#social-post-content');
          }
          // Social Ad Copy
          else if (props.contentType === 'social-ad-copy') {
               makeElementEditable(doc, '#ad-copy-cta');
          }
          // Email Marketing
          else if (props.contentType === 'email-marketing') {
               makeElementEditable(doc, '#email-body');
          }
          // Product Descriptions
          else if (props.contentType === 'product-descriptions') {
              makeElementEditable(doc, '#product-benefits');
          }
          // Business Proposals
          else if (props.contentType === 'business-proposals') {
              makeElementEditable(doc, '#proposal-overview');
              makeElementEditable(doc, '#proposal-scope');
          }
          // Website Copy
          else if (props.contentType === 'website-copy') {
              makeElementEditable(doc, '#website-message');
          }
          // Press Releases
          else if (props.contentType === 'press-releases') {
            makeElementEditable(doc, '#press-release-body');
          }
  
          // Set the edited content (with contenteditable attributes)
          editableContent.value = doc.body.innerHTML;
  
      }, { immediate: true });
  
       // Helper function to make a *single* element editable and track it.
      const makeElementEditable = (doc, selector) => {
        const element = doc.querySelector(selector);
        if (element) {
          element.setAttribute('contenteditable', 'true');
          editableElements.value.push(element); // Store for later access
        }
      };
  
      // Helper function to make *multiple* elements of the same selector editable.
      const makeElementsEditable = (doc, selector) => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(element => {
          element.setAttribute('contenteditable', 'true');
          editableElements.value.push(element);  // Store for later access
        });
      };
  
      const handleInput = () => {
          // No need to read from DOM on every input, v-html handles updates
          // Just emit an event, or debounce updates if needed.
      };
  
      const saveChanges = () => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(editableContent.value, 'text/html');
  
          //Remove Content Editable
          editableElements.value.forEach(el => {
              el.removeAttribute('contenteditable');
          });
  
        const sanitizedHtml = DOMPurify.sanitize(doc.body.innerHTML);  // Crucial: Sanitize!
        emit('update:contentHtml', sanitizedHtml);
        emit('notification', { message: 'Changes saved', type: 'success' });
      };
  
      const cancelChanges = () => {
        editableContent.value = originalContent.value; // Revert to original
         emit('notification', { message: 'Changes cancelled', type: 'info' });
      };
  
      return { editableContent, saveChanges, cancelChanges, handleInput };
    }
  };
  </script>
  
  <style scoped>
  .content-editor {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background-color: white;
  }
  
  [contenteditable="true"] {
    outline: 2px solid #2563eb; /* Highlight editable elements */
    padding: 0.2em;
    border-radius: 4px;
  }
  /* Basic styling for editable elements (adjust as needed) */
  [contenteditable="true"]:focus {
     background-color: #f0f8ff; /* Light blue background on focus */
  }
  </style>