// src/components/ContentPreview.vue (Corrected)
<template>
  <div class="p-4 border rounded shadow-sm content-preview-container">
    <h2 class="text-xl font-weight-bold mb-4">Content Preview</h2>
    <div ref="previewContent" :innerHTML="sanitizedContentHtml" class="content-preview"></div>
     <div class="mt-3">
      <!-- Save Edits Button -->
      <button @click="saveEdits" class="btn btn-success me-2">Save Edits</button>

      <!-- Download Button -->
      <button @click="downloadContent" class="btn btn-primary">Download</button>
    </div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify';
import { ref, watch, onMounted } from 'vue';
import html2pdf from 'html2pdf.js';


export default {
  name: 'ContentPreview',
  props: {
    contentHtml: {
      type: String,
      default: '',
    },
    contentData: {
      type: Object,
      required: true,
    },
    contentType: { //For Download
      type: String,
      required: true
    }
  },
  setup(props, { emit }) { // Correctly destructure emit
    const sanitizedContentHtml = ref('');
    const previewContent = ref(null); // Ref for the preview div

    const injectData = () => {
      if (!props.contentHtml || !props.contentData) {
        sanitizedContentHtml.value = '';
        return;
      }

      let html = props.contentHtml;
      const data = props.contentData;

      // Helper function to create spans with contenteditable
      const createEditableSpan = (value, dataKey) => {
        return `<span data-key="${dataKey}" contenteditable="true">${value || ''}</span>`; // Handle null/undefined
      };
     const createEditableParagraph = (value, dataKey) => {
        return `<p data-key="${dataKey}" contenteditable="true">${value || ''}</p>`; // Handle null/undefined
      };
      const createEditableList = (value, dataKey) => {
           let listItems = '';
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                  listItems += `<li data-key="${dataKey}.${index}" contenteditable="true">${item}</li>`;
                });
              }
        return `<ul>${listItems}</ul>`; // Handle null/undefined
      };

      // Generic Placeholder Replacement (for simple text fields)
      for (const key in data) {
        if (typeof data[key] === 'string') {
          const regex = new RegExp(`\\[${key.toUpperCase()}_PLACEHOLDER\\]`, 'g');
          html = html.replace(regex, createEditableSpan(data[key], key));
        }
      }

      // --- Specific Content Type Placeholders (for more complex structures) ---
      // Resume
        if (props.contentType === 'resume') {
            // Work Experience
            const workExpRegex = /\[WORKEXPERIENCE_PLACEHOLDER\]/g;
            let workExpHtml = '';
            if(Array.isArray(data.workExperience)){ //Check array
                data.workExperience.forEach((exp, index) => {
                    workExpHtml += `<div data-key="workExperience.${index}">`;
                    workExpHtml += `<p><strong>Company:</strong> ${createEditableSpan(exp.company, `workExperience.${index}.company`)}</p>`;
                    workExpHtml += `<p><strong>Job Title:</strong> ${createEditableSpan(exp.jobTitle, `workExperience.${index}.jobTitle`)}</p>`;
                    workExpHtml += `<p><strong>Dates:</strong> ${createEditableSpan(exp.startDate, `workExperience.${index}.startDate`)} - ${exp.current ? 'Present' : createEditableSpan(exp.endDate || '', `workExperience.${index}.endDate`)}</p>`; // Handle undefined endDate
                    workExpHtml += `<p><strong>Responsibilities:</strong></p>${createEditableList(exp.responsibilities,`workExperience.${index}.responsibilities`)}`;
                    workExpHtml += `</div>`;
                });
            }
            html = html.replace(workExpRegex, workExpHtml);

            // Education
            const educationRegex = /\[EDUCATION_PLACEHOLDER\]/g;
            let educationHtml = '';
            if(Array.isArray(data.education)){
                data.education.forEach((edu, index) => {
                  educationHtml += `<div data-key="education.${index}">`;
                  educationHtml += `<p><strong>Institution:</strong> ${createEditableSpan(edu.institution, `education.${index}.institution`)}</p>`;
                  educationHtml += `<p><strong>Degree:</strong> ${createEditableSpan(edu.degree, `education.${index}.degree`)}</p>`;
                  if (edu.major) educationHtml += `<p><strong>Major:</strong> ${createEditableSpan(edu.major, `education.${index}.major`)}</p>`;
                  if (edu.minor) educationHtml += `<p><strong>Minor:</strong> ${createEditableSpan(edu.minor, `education.${index}.minor`)}</p>`;
                  educationHtml += `<p><strong>Dates:</strong> ${createEditableSpan(edu.startDate, `education.${index}.startDate`)} - ${edu.current ? 'Present' : createEditableSpan(edu.endDate || '', `education.${index}.endDate`)}</p>`;  // Handle undefined endDate
                  educationHtml += `</div>`;
                });
            }
            html = html.replace(educationRegex, educationHtml);

            // Skills
            const skillsRegex = /\[SKILLS_PLACEHOLDER\]/g;
            html = html.replace(skillsRegex, createEditableList(data.skills, 'skills'));

        } else if (props.contentType === 'poster') {
            // Poster
            html = html.replace(/\[TITLE_PLACEHOLDER\]/g, createEditableSpan(data.title, 'title'));
            html = html.replace(/\[SUBTITLE_PLACEHOLDER\]/g, createEditableSpan(data.subtitle, 'subtitle'));
            html = html.replace(/\[BODY_PLACEHOLDER\]/g, createEditableParagraph(data.body, 'body'));
            html = html.replace(/\[CALLTOACTION_PLACEHOLDER\]/g, createEditableSpan(data.callToAction, 'callToAction'));
            html = html.replace(/\[CONTACTINFO_PLACEHOLDER\]/g, createEditableSpan(data.contactInfo, 'contactInfo'));

        } else if (props.contentType === 'social') {
             // Social
            html = html.replace(/\[PLATFORM_PLACEHOLDER\]/g, createEditableSpan(data.platform, 'platform'));
            html = html.replace(/\[CONTENT_PLACEHOLDER\]/g, createEditableParagraph(data.content, 'content'));
            html = html.replace(/\[HASHTAGS_PLACEHOLDER\]/g, createEditableList(data.hashtags, 'hashtags'));
            html = html.replace(/\[MENTIONS_PLACEHOLDER\]/g, createEditableList(data.mentions, 'mentions'));
        } else if(props.contentType === "custom") {
            // Custom HTML - Make the whole thing editable
            html = `<div contenteditable="true" data-key="html">${data.html || ''}</div>`; // Handle undefined
        }


      sanitizedContentHtml.value = DOMPurify.sanitize(html);
       // Observe changes after setting content
      observeChanges();
    };

    const downloadContent = () => {
        const element = document.createElement('div');
        // Get Current HTML
        element.innerHTML = previewContent.value.innerHTML;

        let filename = 'generated-content.pdf'; // Default
        if (props.contentType === 'resume') {
            filename = 'my-resume.pdf';
        } else if (props.contentType === 'poster') {
            filename = 'my-poster.pdf';
        }
        // ... add other content type filenames

         const opt = {
            margin: 0.5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if (props.contentType === "custom"){
          //For custom HTML, download as .html file
          const blob = new Blob([element.innerHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'custom.html';
          document.body.appendChild(a); // Append the link to the body
          a.click();
          document.body.removeChild(a);  // Remove the link from the body
          URL.revokeObjectURL(url);

        } else {
             html2pdf().from(element).set(opt).save();
        }


    };

      const saveEdits = () => {
        // Get all editable spans
        const editableSpans = previewContent.value.querySelectorAll('[data-key]');

        // Create a copy of the content data to update
        const updatedData = { ...props.contentData };

        editableSpans.forEach(span => {
            const dataKey = span.dataset.key;
            const value = span.innerText;

            // Handle nested keys (e.g., "workExperience.0.company")
            const keyParts = dataKey.split('.');
             let currentObject = updatedData;
            for (let i = 0; i < keyParts.length - 1; i++) {
                const part = keyParts[i];
                if (!isNaN(parseInt(part))) { // Array index
                    currentObject = currentObject[parseInt(part)];
                } else {
                    currentObject = currentObject[part];
                }
                if (!currentObject) return; // Handle cases where the nested property doesn't exist
            }
            const finalKey = keyParts[keyParts.length - 1];
             if (!isNaN(parseInt(finalKey))) { // Array index for list
                 if (Array.isArray(currentObject)) {
                    currentObject[parseInt(finalKey)] = value;
                }
            } else {
                currentObject[finalKey] = value;
            }

        });

        // Emit the updated data
        emit('content-updated', updatedData); // Correctly use emit
    };



      const observer = new MutationObserver(() => {
        // saveEdits(); // Call saveEdits on any DOM change within preview
        // console.log("DOM changed");
    });

    const observeChanges = () => {
      if (previewContent.value) {
        observer.observe(previewContent.value, {
          childList: true,
          subtree: true,
          characterData: true, // Listen for text changes
        });
      }
    };


    watch([() => props.contentHtml, () => props.contentData], injectData, { immediate: true });

     onMounted(() => {
      // Ensure the observer starts after the initial content is loaded
      observeChanges();
    });


    return { sanitizedContentHtml, previewContent, downloadContent, saveEdits };
  },
   beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
};
</script>

<style scoped>
.content-preview {
  font-family: sans-serif;
}
/* Add style to highlight editable content */
[contenteditable="true"] {
  background-color: #f0f8ff; /* Light blue background */
  border: 1px dashed #66b3ff; /* Dashed border */
  padding: 2px 5px;
  display: inline-block; /* Or inline-block, depending on the element */
  cursor: text; /* Show text cursor */
  border-radius: 3px;
}
[contenteditable="true"]:focus {
   outline: none;
  box-shadow: 0 0 3px 2px rgba(37, 99, 235, 0.4); /* Focus outline */
}
</style>