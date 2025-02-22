// src/utils/generation.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { updateModelUsage } from "./firebaseUtils";
import { encode } from 'gpt-tokenizer'; // Import the tokenizer
import { auth } from '@/firebase'; // Import Firebase auth

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function generateContent(formData, selectedTemplate, selectedModel, contentType) {
    const prompt = generatePrompt(formData, selectedTemplate, contentType);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedHtml = extractHtmlFromResponse(response.text());

        // Get current user ID
        const userId = auth.currentUser?.uid;

        // Only update usage stats for non-admins
        if (userId && userId !== 'JZHhTYr45NOiIdLbaSaGIDyHT5R2') {
            const inputText = prompt;
            const outputText = response.text();
            const inputTokenCount = encode(inputText).length;
            const outputTokenCount = encode(outputText).length;
            const totalTokens = inputTokenCount + outputTokenCount;
            updateModelUsage(selectedModel, totalTokens);
        }

        return { html: generatedHtml };

    } catch (error) {
        console.error("Error generating content:", error);
        if (error.message.includes("400")) {
            throw new Error("Invalid request to the AI model. Please check your input data.");
        } else if (error.message.includes("429")) {
            throw new Error("Too many requests to the AI model. Please try again later.");
        } else if(error.message.includes("500")){
           throw new Error("Internal Server to the AI model. Please try again later");
        }else {
            throw new Error("Failed to generate content. Please check your API key and network connection.");
        }
    }
}

// ... (rest of your generatePrompt and extractHtmlFromResponse functions remain unchanged) ...
function generatePrompt(formData, selectedTemplate, contentType) {
    let prompt = `Generate HTML for a ${contentType} based on the following information.  Apply the CSS class "${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}" to the outermost container element of the generated HTML. Output *only* valid HTML code. Do *not* include any introductory or concluding phrases.

**Template Class:** ${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}

`;

    // --- Content-Specific Instructions ---
    if (contentType === 'resume') {
      prompt += `
**Resume Information:**
${formData.summary ? `**Summary:** ${formData.summary}\n` : ''}
${formData.workExperience ? `**Work Experience:**\n${formData.workExperience.map(exp => `- ${exp}`).join('\n')}\n` : ''}
${formData.education ? `**Education:**\n${formData.education.map(edu => `- ${edu}`).join('\n')}\n` : ''}
${formData.skills ? `**Skills:** ${formData.skills.join(', ')}\n` : ''}

**Personal Information (Placeholders):**
*   Name: [NAME_PLACEHOLDER]
*   Email: [EMAIL_PLACEHOLDER]
*   Phone: [PHONE_PLACEHOLDER]
${formData.linkedin ? `*   LinkedIn: [LINKEDIN_PLACEHOLDER]\n` : ''}
${formData.github ? `*   GitHub: [GITHUB_PLACEHOLDER]\n` : ''}
`;
    } else if (contentType === 'poster') {
      prompt += `
**Poster Information:**
${formData.title ? `**Title:** ${formData.title}\n` : ''}
${formData.subtitle ? `**Subtitle:** ${formData.subtitle}\n` : ''}
${formData.body ? `**Body Text:** ${formData.body}\n` : ''}
${formData.callToAction ? `**Call to Action:** ${formData.callToAction}\n` : ''}
${formData.contactInfo ? `**Contact Information:** ${formData.contactInfo}\n` : ''}
`;
    } else if (contentType === 'social-post') { // Corrected hyphen
        prompt += `
**Social Media Post Information:**
${formData.platform ? `**Platform:** ${formData.platform}\n` : ''}
${formData.content ? `**Post Content:** ${formData.content}\n` : ''}
${formData.hashtags ? `**Hashtags:**\n${formData.hashtags.map(tag => `- ${tag}`).join('\n')}\n` : ''}
${formData.mentions ? `**Mentions:**\n${formData.mentions.map(mention => `- ${mention}`).join('\n')}\n` : ''}
`;

    } else if (contentType === 'social-ad-copy') {
          prompt += `
**Social Media Ad Copy Information:**
${formData.platform ? `**Platform:** ${formData.platform}\n` : ''}
${formData.product ? `**Product/Service:** ${formData.product}\n` : ''}
${formData.targetAudience ? `**Target Audience:** ${formData.targetAudience}\n` : ''}
${formData.keyBenefit ? `**Key Benefit:** ${formData.keyBenefit}\n` : ''}
${formData.callToAction ? `**Call to Action:** ${formData.callToAction}\n` : ''}
`;
      } else if(contentType === 'email-marketing'){
        prompt += `
**Email Marketing Information:**
${formData.emailType ? `**Email Type:** ${formData.emailType}\n` : ''}
${formData.subjectLine ? `**Subject Line:** ${formData.subjectLine}\n` : ''}
${formData.preheader ? `**Preheader Text:** ${formData.preheader}\n` : ''}
${formData.body ? `**Body Content:** ${formData.body}\n` : ''}
${formData.callToAction ? `**Call to Action:** ${formData.callToAction}\n` : ''}
       `;
      }  else if(contentType === 'product-descriptions'){
        prompt += `
**Product Descriptions Information:**
${formData.productName ? `**Product Name:** ${formData.productName}\n` : ''}
${formData.keyFeatures ? `**Key Features:** ${formData.keyFeatures}\n` : ''}
${formData.benefits ? `**Benefits:** ${formData.benefits}\n` : ''}
${formData.targetAudience ? `**Target Audience:** ${formData.targetAudience}\n` : ''}
        `;

      } else if (contentType === 'business-proposals') {
            prompt += `
    **Business Proposal Information:**
    ${formData.clientName ? `**Client Name:** ${formData.clientName}\n` : ''}
    ${formData.projectName ? `**Project Name:** ${formData.projectName}\n` : ''}
    ${formData.projectOverview ? `**Project Overview:**\n${formData.projectOverview}\n` : ''}
    ${formData.objectives ? `**Objectives:**\n${formData.objectives.map(obj => `- ${obj}`).join('\n')}\n` : ''}
    ${formData.scopeOfWork ? `**Scope of Work:**\n${formData.scopeOfWork}\n` : ''}
    ${formData.timeline ? `**Project Timeline:** ${formData.timeline}\n` : ''}
    ${formData.budget ? `**Budget:** ${formData.budget}\n` : ''}
    `;
        } else if (contentType === 'website-copy') {
            prompt += `
    **Website Copy Information:**
    ${formData.pageType ? `**Page Type:** ${formData.pageType}\n` : ''}
    ${formData.targetAudience ? `**Target Audience:** ${formData.targetAudience}\n` : ''}
    ${formData.keyMessage ? `**Key Message:**\n${formData.keyMessage}\n` : ''}
    ${formData.callToAction ? `**Call to Action:** ${formData.callToAction}\n` : ''}
    `;
        } else if (contentType === 'press-releases') {
            prompt += `
    **Press Release Information:**
    ${formData.headline ? `**Headline:** ${formData.headline}\n` : ''}
    ${formData.companyName ? `**Company Name:** ${formData.companyName}\n` : ''}
    ${formData.city ? `**City:** ${formData.city}\n` : ''}
    ${formData.state ? `**State:** ${formData.state}\n` : ''}
    ${formData.releaseDate ? `**Release Date:** ${formData.releaseDate}\n` : ''}
    ${formData.body ? `**Body Text:**\n${formData.body}\n` : ''}
    ${formData.contactName ? `**Contact Name:** ${formData.contactName}\n` : ''}
    ${formData.contactEmail ? `**Contact Email:** ${formData.contactEmail}\n` : ''}
    ${formData.contactPhone ? `**Contact Phone:** ${formData.contactPhone}\n` : ''}
    `;
        }

    // Add user-provided instructions (if any) - keep at the end, after specific content
    if (formData.instructions) {
        prompt += `\n**Additional Instructions:**\n${formData.instructions}\n`;
    }

      prompt += `\n**Output ONLY the HTML code. Do NOT include HTML, HEAD or BODY tags. Do NOT include inline CSS styles (style attributes) unless necessary for basic structure. Styling is handled externally by the template class. Provide only what goes inside the body.  Do NOT output anything other than the HTML.  No comments. No explanations.  No Markdown.**`;
    return prompt;
}

function extractHtmlFromResponse(responseText) {
    //Basic markdown
    let html = responseText
        .replace(/^### (.*$)/gim, '<h3>$1</h3')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>') //Fix for continous list
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
}

export { generateContent };