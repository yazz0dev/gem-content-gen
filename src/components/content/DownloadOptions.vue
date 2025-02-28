---
File: /src/components/content/DownloadOptions.vue
---

<template>
    <div class="download-options">
        <button v-if="showPdfOption" @click="handleDownload('pdf')" class="btn btn-primary me-2" :disabled="disabled">
            <i class="bi bi-file-pdf me-2"></i>Download PDF
        </button>
        <button v-if="showHtmlOption" @click="handleDownload('html')" class="btn btn-secondary me-2" :disabled="disabled">
            <i class="bi bi-filetype-html me-2"></i>Download HTML
        </button>
        <button v-if="showTxtOption" @click="handleDownload('txt')" class="btn btn-secondary me-2" :disabled="disabled">
            <i class="bi bi-file-text me-2"></i>Download Text
        </button>
        <button v-if="showCopyHtmlOption" @click="handleCopy('html')" class="btn btn-secondary" :disabled="disabled">
            <i class="bi bi-clipboard me-2"></i>Copy HTML
        </button>
        <button v-if="showCopyTxtOption" @click="handleCopy('txt')" class="btn btn-secondary" :disabled="disabled">
            <i class="bi bi-clipboard me-2"></i>Copy Text
        </button>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { htmlToPlainText } from '@/utils/formatters';
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
        contentData: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['notification'],
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
                    const plainText = htmlToPlainText(props.contentHtml);
                    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
                    saveAs(blob, `${props.contentType}-${Date.now()}.txt`);
                    notify('Text downloaded successfully');
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
                } else if (format === 'txt') {
                    const plainText = htmlToPlainText(props.contentHtml);
                    copyToClipboard(plainText);
                    notify('Text copied to clipboard');
                }
            } catch (error) {
                console.error('Copy failed:', error);
                notify('Copy failed. Please try again.', 'error');
            }
        };

        // Computed properties for showing/hiding download options
        const showPdfOption = computed(() => ['resume', 'poster', 'business-proposals', 'press-releases'].includes(props.contentType));
        const showHtmlOption = computed(() => ['resume', 'poster', 'business-proposals', 'press-releases', 'email-marketing', 'product-descriptions', 'social-post', 'social-ad-copy', 'website-copy'].includes(props.contentType));
        const showTxtOption = computed(() => ['resume', 'poster', 'business-proposals', 'press-releases', 'email-marketing', 'product-descriptions', 'social-post', 'social-ad-copy', 'website-copy'].includes(props.contentType));

        const showCopyHtmlOption = computed(() => ['resume', 'poster', 'business-proposals', 'press-releases', 'email-marketing', 'product-descriptions', 'social-post', 'social-ad-copy', 'website-copy'].includes(props.contentType));
        const showCopyTxtOption = computed(() => ['resume', 'poster', 'business-proposals', 'press-releases', 'email-marketing', 'product-descriptions', 'social-post', 'social-ad-copy', 'website-copy'].includes(props.contentType));

        return {
            handleDownload,
            handleCopy,
            isDownloading,
            showPdfOption,
            showHtmlOption,
            showTxtOption,
            showCopyHtmlOption,
            showCopyTxtOption
        };
    }
};
</script>

<style scoped>
.download-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
</style>