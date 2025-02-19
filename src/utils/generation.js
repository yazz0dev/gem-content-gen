// src/utils/generation.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import DOMPurify from 'dompurify';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function generateResume(formData, selectedTemplate, customizationPrompt, selectedModel) {
    const prompt = generatePrompt(formData, selectedTemplate, customizationPrompt);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedHtml = extractHtmlFromResponse(response.text());
        return { html: generatedHtml };
    } catch (error) {
        console.error("Error generating resume:", error);
        // Provide more specific error messages based on the error type
        if (error.message.includes("400")) {
            throw new Error("Invalid request to the AI model. Please check your input data.");
        } else if (error.message.includes("429")) {
            throw new Error("Too many requests to the AI model. Please try again later.");
        } else if(error.message.includes("500")){
           throw new Error("Internal Server to the AI model. Please try again later");
        }else {
            throw new Error("Failed to generate resume. Please check your API key and network connection.");
        }
    }
}

function generatePrompt(formData, selectedTemplate, customizationPrompt) {
    let prompt = `Generate an HTML resume based on the following information. Use placeholders for personal details, work experience, education and skills. The output should be *only* valid HTML code. Do *not* include any introductory or concluding phrases.

**Template:** ${selectedTemplate} (Use this as a general style guide.)

**Placeholders to Use:**

*   **Personal Information:**
    *   Name: [NAME_PLACEHOLDER]
    *   Email: [EMAIL_PLACEHOLDER]
    *   Phone: [PHONE_PLACEHOLDER]
    *   LinkedIn: [LINKEDIN_PLACEHOLDER]
    *   GitHub: [GITHUB_PLACEHOLDER]
    *   Portfolio: [PORTFOLIO_PLACEHOLDER]
*   **Summary:** [SUMMARY_PLACEHOLDER]
*   **Work Experience:** [WORK_EXPERIENCE_PLACEHOLDER] (This should be a single placeholder that will be replaced with multiple entries.)
* **Education:** [EDUCATION_PLACEHOLDER] (Single placeholder, multiple entries.)
*   **Skills:** [SKILLS_PLACEHOLDER] (Single placeholder, comma-separated.)

**Example Structure (Illustrative - Follow the Selected Template):**

\`\`\`html
<div class="resume-container">
  <div class="header">
    <h1>[NAME_PLACEHOLDER]</h1>
    <p>[EMAIL_PLACEHOLDER] | [PHONE_PLACEHOLDER]</p>
  </div>
  <div class="summary">
     <h2>Summary</h2>
    [SUMMARY_PLACEHOLDER]
  </div>
  <div class="work-experience">
     <h2>Work Experience</h2>
    [WORK_EXPERIENCE_PLACEHOLDER]
  </div>
    <div class="education">
     <h2>Education</h2>
    [EDUCATION_PLACEHOLDER]
  </div>
    <div class="skills">
     <h2>Skills</h2>
    [SKILLS_PLACEHOLDER]
  </div>
</div>
\`\`\`

`;    // Add the customization prompt if one is selected
if (customizationPrompt) {
    prompt += `\n\n**Additional Instructions:**\n${customizationPrompt}\n`;
}

prompt += `\n**Output ONLY the HTML code. Do NOT include HTML, HEAD or BODY tags. Do NOT include inline CSS styles (style attributes). Styling will be handled externally. Provide only what goes inside the body.  Do NOT output anything other than the HTML.  No comments. No explanations.  No Markdown.**`;
return prompt;
}

function extractHtmlFromResponse(responseText) {
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
}

export { generateResume };


// --- IP Blocking (Conceptual - Requires Server-Side Implementation) ---
//
// To implement IP-based rate limiting, you *must* use a server-side
// component (like Firebase Cloud Functions) to:
//
// 1.  **Receive the request:**  The client sends a request to the Cloud
//     Function *instead* of directly to the Gemini API.
// 2.  **Get the IP:** The Cloud Function securely retrieves the user's IP
//     address.  (Client-side IP detection is unreliable and easily spoofed.)
// 3.  **Check the database:**  Query a Firestore collection (e.g.,
//     `ipRateLimits`) to see if the IP has exceeded its limit within the
//     time window (e.g., 1 request per 24 hours).
// 4.  **Increment/Store:** If the IP is allowed, increment a counter for
//     that IP and store/update the timestamp.
// 5.  **Call Gemini:**  If the IP is allowed, the Cloud Function then calls
//     the Gemini API on behalf of the user.
// 6.  **Return Response:** The Cloud Function returns the Gemini response
//     (or an error) to the client.
//
// The `canGenerateResume` function would need to be adapted to check
// against the `ipRateLimits` collection instead of (or in addition to) the
// per-user limit.  You would also need separate functions to handle the IP
// tracking.
//
// This is a simplified description; a robust implementation would need to
// consider edge cases, potential abuse, and appropriate data structures for
// efficient querying.
