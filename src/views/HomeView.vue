// /src/views/HomeView.vue (Complete and Correct)
<template>
  <div class="container my-4">
    <h1 class="text-4xl font-weight-bold text-center mb-4">AI Resume Builder</h1>

    <TemplateSelector @template-selected="handleTemplateSelection" />
    <CustomizationPrompts @prompt-selected="handlePromptSelected" @prompt-cleared="handlePromptCleared" />
    <ResumeForm :selectedTemplate="selectedTemplate" @generate-resume="handleGenerateResume" />

    <div v-if="resumeHtml" class="mt-4">
      <ResumePreview :resumeHtml="resumeHtml" />
      <RatingComponent v-if="showRating" :model-name="selectedModel" @rating-submitted="hideRatingComponent"
        @rating-closed="hideRatingComponent" />
      <div class="mt-4 text-center">
        <button @click="downloadResume" class="btn btn-primary">
          Download PDF
        </button>
      </div>
    </div>

    <LoadingSpinner :loading="isLoading" />
    <div v-if="errorMessage" class="alert alert-danger mt-4" role="alert">
      <strong>Error!</strong>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script>
import ResumeForm from "@/components/ResumeForm.vue";
import ResumePreview from "@/components/ResumePreview.vue";
import TemplateSelector from "@/components/TemplateSelector.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import RatingComponent from "@/components/RatingComponent.vue";
import CustomizationPrompts from "@/components/CustomizationPrompts.vue"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2pdf from 'html2pdf.js';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/firebase';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default {
  name: "HomeView",
  components: {
    ResumeForm,
    ResumePreview,
    TemplateSelector,
    LoadingSpinner,
    RatingComponent,
    CustomizationPrompts, // Register
  },
  data() {
    return {
      isLoading: false,
      selectedTemplate: "Template 1",
      selectedModel: "gemini-1.5-pro",
      resumeHtml: "",
      errorMessage: "",
      showRating: false,
      selectedCustomizationPrompt: "", // Store the selected customization prompt
    };
  },
  methods: {
    handleTemplateSelection(template) {
      this.selectedTemplate = template;
      this.resumeHtml = "";
      this.showRating = false;
    },
    handlePromptSelected(prompt) {
      this.selectedCustomizationPrompt = prompt;
    },
    handlePromptCleared() {
      this.selectedCustomizationPrompt = ""; // Clear the prompt
    },
    async handleGenerateResume(data) {
      const user = auth.currentUser;

      if (!user) {
        this.errorMessage = "You must be logged in to generate a resume";
        return;
      }

      const userId = user.uid;

      if (!(await this.canGenerateResume(userId))) {
        this.errorMessage = "You have reached the daily limit of 1 resume generation. Please try again tomorrow.";
        return;
      }

      this.isLoading = true;
      this.resumeHtml = "";
      this.errorMessage = "";

      const prompt = this.generatePrompt(data.formData, data.selectedTemplate);
      const model = genAI.getGenerativeModel({ model: this.selectedModel });

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedHtml = this.extractHtmlFromResponse(response.text());
        this.resumeHtml = generatedHtml;

        await this.updateLastGenerationDate(userId);
        this.showRating = true;

      } catch (error) {
        console.error("Error generating resume:", error);
        // More specific error handling
        if (error.message.includes("400")) {  // Example: Check for a specific error code
          this.errorMessage = "Invalid request to the AI model. Please check your input data.";
        } else if (error.message.includes("429")) {
          this.errorMessage = "Too many requests to the AI model. Please try again later.";
        } else if (error.message.includes("500")) {
          this.errorMessage = "Internal Server to the AI model. Please try again later";
        } else {
          this.errorMessage = "Failed to generate resume. Please check your API key, network connection, and ensure all required fields are filled.";
        }
      } finally {
        this.isLoading = false;
      }
    },
    generatePrompt(formData, selectedTemplate) {
      let prompt = `Generate an HTML resume based on the following information. The output should be *only* valid HTML code, with no surrounding text, explanations, or Markdown. Do *not* include any introductory or concluding phrases.

**Template:** ${selectedTemplate} (Use this as a general style guide. The exact layout details will be handled by CSS, but follow the template's overall aesthetic.)

**Personal Information:**
`;

      if (formData.name) prompt += `- Name: ${formData.name}\n`;
      if (formData.email) prompt += `- Email: ${formData.email}\n`;
      if (formData.phone) prompt += `- Phone: ${formData.phone}\n`;
      if (formData.linkedin) prompt += `- LinkedIn: <a href="${formData.linkedin}" target="_blank">${formData.linkedin}</a>\n`;
      if (formData.github) prompt += `- GitHub: <a href="${formData.github}" target="_blank">${formData.github}</a>\n`;
      if (formData.portfolio) prompt += `- Portfolio: <a href="${formData.portfolio}" target="_blank">${formData.portfolio}</a>\n`;

      prompt += `\n**Summary:**\n${formData.summary}\n`;

      prompt += `\n**Work Experience:**\n`;
      formData.workExperience.forEach(exp => {
        prompt += `- Company: ${exp.company}\n`;
        prompt += `- Job Title: ${exp.jobTitle}\n`;
        prompt += `- Dates: ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
        prompt += `- Responsibilities:\n`;
        exp.responsibilities.split('\n').forEach(line => {
          prompt += `    - ${line}\n`;
        });
      });

      prompt += `\n**Education:**\n`;
      formData.education.forEach(edu => {
        prompt += `- Institution: ${edu.institution}\n`;
        prompt += `- Degree: ${edu.degree}\n`;
        if (edu.major) prompt += `- Major: ${edu.major}\n`;
        if (edu.minor) prompt += `- Minor: ${edu.minor}\n`;
        prompt += `- Dates: ${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}\n`;
      });

      prompt += `\n**Skills:**\n${formData.skills.join(', ')}\n`;

      // Add the customization prompt if one is selected
      if (this.selectedCustomizationPrompt) {
        prompt += `\n\n**Additional Instructions:**\n${this.selectedCustomizationPrompt}\n`;
      }

      prompt += `\n**Output ONLY the HTML code. Do NOT include HTML, HEAD or BODY tags.  Do NOT include inline CSS styles (style attributes).  Styling will be handled externally. Provide only what goes inside the body**`;
      return prompt;
    },
    extractHtmlFromResponse(responseText) {
      let html = responseText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');

      if (!html.trim().startsWith('<')) {
        html = `<div>${html}</div>`;
      }
      // Use DOMParser for more robust parsing (and sanitization)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Sanitize: Remove any potentially dangerous elements (e.g., <script>)
      const scripts = doc.querySelectorAll('script');
      scripts.forEach(script => script.remove());

      // Return the sanitized HTML content
      return doc.body.innerHTML;
    },
    downloadResume() {
      const element = document.createElement('div');
      element.innerHTML = this.resumeHtml;
      const opt = {
        margin: 0.5,
        filename: 'my-resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        console.log("PDF generated successfully");
      }).catch(err => {
        console.error("PDF generation failed:", err);
        this.errorMessage = "Failed to generate PDF.  Please try again.";
      });
    },
    async canGenerateResume(userId) {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const lastGeneration = userData.lastGenerationDate;

        if (!lastGeneration) {
          return true;
        }

        const now = new Date();
        const last = new Date(lastGeneration);
        const diffInMilliseconds = now - last;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        return diffInHours >= 24;

      } else {
        return true;
      }
    },
    async updateLastGenerationDate(userId) {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      const now = new Date();

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          lastGenerationDate: now.getTime()
        });
      } else {
        await setDoc(userDocRef, {
          lastGenerationDate: now.getTime()
        });
      }
    },
    hideRatingComponent() {
      this.showRating = false;
    },
  },

};
</script>