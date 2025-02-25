<template>
    <div class="download-options">
      <button @click="handleDownload('pdf')" class="btn btn-primary me-2" :disabled="disabled">
        <i class="bi bi-file-pdf me-2"></i>Download PDF
      </button>
      <button @click="handleDownload('html')" class="btn btn-secondary me-2" :disabled="disabled">
        <i class="bi bi-filetype-html me-2"></i>Download HTML
      </button>
      <button @click="handleDownload('txt')" class="btn btn-secondary me-2" :disabled="disabled">
        <i class="bi bi-file-text me-2"></i>Download Text
      </button>
      <button @click="handleDownload('json')" class="btn btn-secondary me-2" :disabled="disabled">
        <i class="bi bi-filetype-json me-2"></i>Download JSON
      </button>
      <button @click="handleCopy('html')" class="btn btn-secondary" :disabled="disabled">
        <i class="bi bi-clipboard me-2"></i>Copy HTML
      </button>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import html2pdf from 'html2pdf.js';
  import { saveAs } from 'file-saver'; // Import file-saver
  import { htmlToPlainText } from '@/utils/formatters'; // Import utility
  import copyToClipboard from 'copy-to-clipboard';
  
  export default {
    name: 'DownloadOptions',
    props: {
      contentHtml: {
        type: String,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
      contentData: { // Raw form data
        type: Object,
        required: true,
      },
      disabled: { // To disable buttons during generation
        type: Boolean,
        default: false,
      },
    },
    emits: ['notification'], // Emit for notifications
    setup(props, { emit }) {
      const isDownloading = ref(false);
  
      const notify = (message, type = 'success') => {
        emit('notification', { message, type });
      };
  
      const handleDownload = async (format) => {
        if (isDownloading.value) return;
        isDownloading.value = true;
  
        try {
          if (format === 'pdf') {
            const element = document.createElement('div');
            element.innerHTML = props.contentHtml;
            const opt = {
              margin: 1,
              filename: `${props.contentType}-${Date.now()}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
            notify('PDF downloaded successfully');
          } else if (format === 'html') {
            const blob = new Blob([props.contentHtml], { type: 'text/html;charset=utf-8' });
            saveAs(blob, `${props.contentType}-${Date.now()}.html`);
            notify('HTML downloaded successfully');
          } else if (format === 'txt') {
            const plainText = htmlToPlainText(props.contentHtml); // Use utility function
            const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, `${props.contentType}-${Date.now()}.txt`);
            notify('Text downloaded successfully');
          } else if (format === 'json') {
            const blob = new Blob([JSON.stringify(props.contentData, null, 2)], { type: 'application/json' });
            saveAs(blob, `${props.contentType}-${Date.now()}.json`);
            notify('JSON downloaded successfully');
          }
        } catch (error) {
          console.error('Download failed:', error);
          notify('Download failed. Please try again.', 'error');
        } finally {
          isDownloading.value = false;
        }
      };
  
      const handleCopy = (format) => {
        try {
          if (format === 'html') {
            copyToClipboard(props.contentHtml);
            notify('HTML copied to clipboard');
          }
        } catch (error) {
          console.error('Copy failed:', error);
          notify('Copy failed. Please try again.', 'error');
        }
      };
  
      return { handleDownload, handleCopy, isDownloading };
    },
  };
  </script>
  
  <style scoped>
  /* Add your styles here */
  .download-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  </style>