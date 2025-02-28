// src/components/ui/TemplateSelector.vue
<template>
    <div class="mb-4">
        <h2 class="text-xl font-weight-bold mb-3">Select a Template</h2>
        <div class="row">
            <div v-for="(template, index) in templates" :key="index" @click="selectTemplate(template.name)"
                class="col-md-3 mb-4 template-option" :class="{ 'selected': selectedTemplate === template.name }">
                <!-- Apply template CSS class to a container div -->
                <div :class="template.className" class="template-preview p-3">
                    <!--  Content based on the template -->
                    <template v-if="template.name === 'Modern'">
                        <h1>Modern Template</h1>
                        <p>A sleek and professional design.</p>
                        <ul>
                            <li>Feature 1</li>
                            <li>Feature 2</li>
                        </ul>
                    </template>
                    <template v-if="template.name === 'Classic'">
                        <h2>Classic Template</h2>
                        <p>A traditional and timeless look.</p>
                        <hr>
                        <p>Contact Information</p>
                    </template>
                    <template v-if="template.name === 'Minimalist'">
                        <h3>Minimalist</h3>
                        <p>Clean and simple, focused on content.</p>
                    </template>
                    <template v-if="template.name === 'Creative'">
                        <h4 style="color: #4a90e2;">Creative</h4>
                        <p>Bold and visually engaging.</p>
                        <div style="background-color: #f0f0f0; padding: 10px;">Highlights</div>
                    </template>
                </div>
                <p class="text-center mt-2">{{ template.name }}</p>
                <!-- Add a checkmark icon (using Bootstrap Icons) -->
                <div v-if="selectedTemplate === template.name" class="position-absolute top-0 end-0 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                        class="bi bi-check-circle-fill text-success" viewBox="0 0 16 16">
                        <path
                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                    </svg>
                </div>
            </div>
        </div>
        <p v-if="selectionError" class="text-danger mt-2">{{ selectionError }}</p>
    </div>
</template>

<script>
    export default {
        name: 'TemplateSelector',
        data() {
            return {
                templates: [
                    { name: 'Modern', className: 'template-modern' },
                    { name: 'Classic', className: 'template-classic' },
                    { name: 'Minimalist', className: 'template-minimalist' },
                    { name: 'Creative', className: 'template-creative' },
                ],
                selectedTemplate: 'Modern', // Default template
                selectionError: ''
            };
        },
        watch: {
            selectedTemplate(newTemplate) {
                if (!newTemplate) {
                    this.selectionError = 'Please select a template.';
                } else {
                    this.selectionError = '';
                }
            }
        },
        methods: {
            selectTemplate(templateName) {
                this.selectedTemplate = templateName;
                this.$emit('template-selected', templateName);
            },
        },
        mounted() {
            this.$emit('template-selected', this.selectedTemplate);
        }
    };
</script>

<style scoped>
    /* Add styles for positioning the checkmark */
    .template-option {
        position: relative;
        /* For absolute positioning of the checkmark */
    }

    /* Basic styling for the preview (customize as needed) */
    .template-preview {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        height: 200px;
        /* Set a fixed height for consistent preview sizes */
    }
</style>