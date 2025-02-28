// src/components/content/ContentEditor.vue
<template>
  <div class="content-editor" ref="editor" v-html="contentHtml" contenteditable="true" @input="handleInput">
  </div>
  <div class="editor-actions mt-2">
    <button @click="saveChanges" class="btn btn-success me-2">Save Changes</button>
    <button @click="cancelChanges" class="btn btn-secondary">Cancel</button>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import DOMPurify from 'dompurify';

export default {
  name: 'ContentEditor',
  props: {
    contentHtml: {
      type: String,
      required: true
    },
  },
  emits: ['update:contentHtml', 'notification'],
  setup(props, { emit }) {
    const editor = ref(null);
    const originalContent = ref(props.contentHtml);

    const handleInput = () => {
      // We don't need to do anything here, v-html updates are enough.
      // Debouncing is handled in the parent component.
    };

    const saveChanges = async () => {
        const unsanitizedHtml = editor.value.innerHTML;
        const sanitizedHtml = DOMPurify.sanitize(unsanitizedHtml);
        emit('update:contentHtml', sanitizedHtml);
        emit('notification', { message: 'Changes saved', type: 'success' });
        originalContent.value = sanitizedHtml; // Update the original content.
    };

    const cancelChanges = () => {
      // Reset the content to the *original* value, then use nextTick
      editor.value.innerHTML = originalContent.value;
      emit('notification', { message: 'Changes cancelled', type: 'info' });
    };

    onMounted(() => {
        originalContent.value = props.contentHtml; // Store the initial HTML.
    });

    return { editor, handleInput, saveChanges, cancelChanges };
  }
};
</script>

<style scoped>
.content-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background-color: white;
  min-height: 200px;
}

[contenteditable="true"] {
  outline: 2px solid #2563eb; /* Highlight editable elements */
  padding: 0.2em;
  border-radius: 4px;
}

[contenteditable="true"]:focus {
  background-color: #f0f8ff; /* Light blue background on focus */
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
}
</style>