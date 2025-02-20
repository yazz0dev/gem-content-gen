// src/utils/generation.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function generateContent(formData, selectedTemplate, selectedModel, contentType) {
    const prompt = generatePrompt(formData, selectedTemplate, contentType);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedHtml = extractHtmlFromResponse(response.text());
        return { html: generatedHtml };
    } catch (error) {
        console.error("Error generating content:", error);
        // Provide more specific error messages based on the error type
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
function generatePrompt(formData, selectedTemplate, contentType) {
    let prompt = `Generate HTML for a ${contentType} based on the following information.  Apply the CSS class "${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}" to the outermost container element of the generated HTML. Output *only* valid HTML code. Do *not* include any introductory or concluding phrases.

**Template Class:** ${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}

`;

    // --- Content-Specific Placeholders and Instructions ---
    if (contentType === 'resume') {
        prompt += `
**Placeholders to Use:**

*   **Personal Information:**
    *   Name: [NAME_PLACEHOLDER]
    *   Email: [EMAIL_PLACEHOLDER]
    *   Phone: [PHONE_PLACEHOLDER]
    *   LinkedIn: [LINKEDIN_PLACEHOLDER]
    *   GitHub: [GITHUB_PLACEHOLDER]
*   **Summary:** [SUMMARY_PLACEHOLDER]
*   **Work Experience:** [WORKEXPERIENCE_PLACEHOLDER] (Multiple entries)
*   **Education:** [EDUCATION_PLACEHOLDER] (Multiple entries)
*   **Skills:** [SKILLS_PLACEHOLDER] (Comma-separated)

**Example Structure (Illustrative - Follow the Selected Template):**

\`\`\`html
<div class="${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}">
  <div class="header">
    <h1>[NAME_PLACEHOLDER]</h1>
    <p>[EMAIL_PLACEHOLDER] | [PHONE_PLACEHOLDER]</p>
  </div>
  <div class="summary">
    <h2>Summary</h2>
    [SUMMARY_PLACEHOLDER]
  </div>
  <!-- ... other sections ... -->
</div>
\`\`\`
`;
    } else if (contentType === 'poster') {
        prompt += `
**Placeholders:**

*   Title: [TITLE_PLACEHOLDER]
*   Subtitle: [SUBTITLE_PLACEHOLDER]
*   Body Text: [BODY_PLACEHOLDER]
*   Call to Action: [CALLTOACTION_PLACEHOLDER]
*   Contact Information: [CONTACTINFO_PLACEHOLDER]
`;
    } else if (contentType === 'social') {
          prompt += `
**Placeholders:**
* Platform: [PLATFORM_PLACEHOLDER]
* Content: [CONTENT_PLACEHOLDER]
* Hashtags: [HASHTAGS_PLACEHOLDER]
* Mentions: [MENTIONS_PLACEHOLDER]
`;

    } else if (contentType === 'custom') {
        prompt += `
**Instructions:**

The user will provide raw HTML.  Output their provided HTML *exactly* as given, without modification. Do not add any additional text or explanations.
`;
    }

     // Add user-provided instructions (if any)
    if (formData.instructions) {
        prompt += `\n**Additional Instructions:**\n${formData.instructions}\n`;
    }


    prompt += `\n**Output ONLY the HTML code. Do NOT include HTML, HEAD or BODY tags. Do NOT include inline CSS styles (style attributes) unless necessary for basic structure. Styling is handled externally by the template class. Provide only what goes inside the body.  Do NOT output anything other than the HTML.  No comments. No explanations.  No Markdown.**`;

    // If it's custom, output the user's raw HTML *without* any wrapping
    if (contentType === 'custom') {
        return formData.html; // Return directly, bypassing the usual prompt structure
    }

    return prompt;
}
function extractHtmlFromResponse(responseText) {
    let html = responseText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
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