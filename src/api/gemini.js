// src/api/gemini.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getDeveloperApiKey } from '@/utils/auth';
import { auth } from '@/firebase';
import DOMPurify from 'dompurify';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import pLimit from 'p-limit';

const getGenAI = () => {
    const user = auth.currentUser;
    const developerApiKey = getDeveloperApiKey();

    if (user) {
        return new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    } else if (developerApiKey) {
        return new GoogleGenerativeAI(developerApiKey);
    } else {
        throw new Error("Please sign in or provide a developer API key.");
    }
}

const genAI = getGenAI();

// Define the tools (functions) that Gemini can call
const tools = [
  {
    functionDeclarations: [
      {
        name: "generate_html_content",
        description: "Generates HTML content based on provided data and a template.",
        parameters: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              description: "The type of content to generate (e.g., resume, poster, social-post).",
            },
            formData: {
              type: "object",
              description: "An object containing the data to use for content generation.",
            },
             selectedTemplate: {
              type: "string",
              description: "Name of template to use.",
            },
            instructions: {
              type: "string",
              description: "Additional instructions (optional).",
            },
            enhanceFlags: {
             type: "object",
             description: "Object containing keys for enhanced content",
            }
          },
          required: ["contentType", "formData", "selectedTemplate"],
        },
      },
       // ... You could add more functions here if needed ...
    ],
  },
];

//Safety Settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Axios instance with retry logic
const apiClient = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/models', // Correct base URL
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': getGenAI().apiKey, //Dynamically sets apikey
  },
});

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  },
    onRetry: (retryCount, error, requestConfig) => {
        console.warn(`Retrying request (attempt ${retryCount}): ${error.message}. URL: ${requestConfig.url}`);
    },
});

// Concurrency limit
const limit = pLimit(10); // Limit to 10 concurrent requests (adjust based on your needs and Gemini API limits)

export async function generateContentWithGemini(formData, selectedTemplate, selectedModel, contentType) {
  return limit(async () => {
    try {
        const model = genAI.getGenerativeModel({ model: selectedModel, tools, safetySettings });

        const prompt = `Generate content for a ${contentType}. Use the provided function call.`;

        // Extract enhance flags from formData
        const enhanceFlags = {};
        for (const key in formData) {
            if (key.endsWith('Enhance')) {
                enhanceFlags[key] = formData[key];
            }
        }

        const chat = model.startChat({
        history: [], //  No chat history for this use case
        tools,
        });

        const result = await chat.sendMessage(prompt); // Using chat for function calling
        const response = result.response;

        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];

            if (candidate.finishReason === 'STOP' && candidate.content?.parts && candidate.content.parts.length > 0) {
                const functionCall = candidate.content.parts[0].functionCall;

                if (functionCall && functionCall.name === 'generate_html_content') {
                    const args = functionCall.args;

                    if (args && args.formData && args.contentType) {
                        const generatedHtml = constructHtmlFromArgs(args, selectedTemplate);
                        return { html: generatedHtml };
                    } else {
                        throw new Error("Invalid function call arguments from Gemini.");
                    }
                } else {
                    // Fallback to text generation if no function call but text is present.
                    if (candidate.content.parts[0].text) {
                        const generatedHtml = extractHtmlFromResponse(candidate.content.parts[0].text);
                         return { html: generatedHtml };
                    }
                    throw new Error("No function call or text found in Gemini response.");
                }
            } else if (candidate.finishReason === 'SAFETY') {
                // Handle safety-related termination
                 console.warn("Content generation stopped due to safety concerns.", candidate);
                throw new Error("Content generation was blocked due to safety concerns. Please revise your input.");
            } else {
              console.warn("Content generation stopped for an unknown reason.", candidate);
              throw new Error(`Content generation stopped unexpectedly. Reason: ${candidate.finishReason}`);
            }
        }
        throw new Error("No valid response from Gemini.");

    } catch (error) {
      console.error("Error in generateContentWithGemini:", error);
      throw new Error(`Failed to generate content: ${error.message}`); // Re-throw with a clear message
    }
  });
}

// Helper function to construct the HTML
function constructHtmlFromArgs(args, selectedTemplate) {
  //... (Your existing constructHtmlFromArgs function) ...
    const { contentType, formData, instructions } = args;
     let html = '';

    if (contentType === 'resume') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`; // Apply template class
        html += `<h1 id="name">${formData.fullName || '[Full Name]'}</h1>`; // Use id for editor targeting
        html += `<p>Email: ${formData.email || '[Email]'}</p>`;
        html += `<p>Phone: ${formData.phone || '[Phone]'}</p>`;
        if (formData.linkedin) html += `<p>LinkedIn: <a href="${formData.linkedin}" target="_blank">${formData.linkedin}</a></p>`;
        if (formData.github) html += `<p>GitHub: <a href="${formData.github}" target="_blank">${formData.github}</a></p>`;

        if (formData.summary) html += `<div class="resume-summary"><p>${formData.summary}</p></div>`;

        if (formData.workExperience && formData.workExperience.length) {
            html += `<div class="work-experience"><h2>Work Experience</h2>`;
            formData.workExperience.forEach(exp => {
                const [company, title, dates, responsibilities] = exp.split(',').map(item => item.trim());
                html += `<div class="experience-item">
                            <h3>${title || '[Title]'} at ${company || '[Company]'}</h3>
                            <p>${dates || '[Dates]'}</p>
                            <p>${responsibilities || '[Responsibilities]'}</p>
                        </div>`;
            });
            html += `</div>`;
        }
         if (!formData.workExperience?.length) {
            html += `<div class="work-experience">No work experience listed.</div>`;
        }

        if (formData.education && formData.education.length) {
            html += `<div class="education-section"><h2>Education</h2>`;
            formData.education.forEach(edu => {
                const [institution, degree, dates] = edu.split(',').map(item => item.trim());
                html += `<div class="education-item">
                            <h3>${degree || '[Degree]'} at ${institution || '[Institution]'}</h3>
                            <p>${dates || '[Dates]'}</p>
                        </div>`;
            });
            html += `</div>`;
        }
         if (!formData.education?.length) {
            html += `<div class="education-section">No education listed.</div>`;
        }

        if (formData.skills && formData.skills.length) {
            html += `<div class="skills-section"><h2>Skills</h2><ul>`;
            formData.skills.forEach(skill => {
                html += `<li>${skill}</li>`;
            });
            html += `</ul></div>`;
        }
         if (!formData.skills?.length) {
             html += `<div class="skills-section">No skills listed.</div>`;
        }

        html += `</div>`; // Close template container

    } else if (contentType === 'poster') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<h1 id="poster-title">${formData.title || '[Title]'}</h1>`; // Use id
        if(formData.subtitle) html += `<h2 id="poster-subtitle">${formData.subtitle}</h2>`;
        html += `<p id="poster-body">${formData.body || '[Body Text]'}</p>`; // Use id
        if(formData.callToAction) html += `<p id="poster-cta">${formData.callToAction}</p>`;
        if(formData.contactInfo) html += `<p id="poster-contact">${formData.contactInfo}</p>`;
        html += `</div>`;
    }
    else if (contentType === 'social-post') {
      html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
      html += `<p><strong>Platform:</strong> ${formData.platform || '[Platform]'}</p>`;
      html += `<p id="social-post-content">${formData.content || '[Post Content]'}</p>`; // Use id
      if (formData.hashtags && formData.hashtags.length) {
        html += `<p><strong>Hashtags:</strong> ${formData.hashtags.join(', ')}</p>`;
      }
      if (formData.mentions && formData.mentions.length) {
        html += `<p><strong>Mentions:</strong> ${formData.mentions.join(', ')}</p>`;
      }
      html += `</div>`;
    }
    else if (contentType === 'social-ad-copy') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Platform:</strong> ${formData.platform || '[Platform]'}</p>`;
        html += `<p><strong>Product/Service:</strong> ${formData.product || '[Product/Service]'}</p>`;
        html += `<p><strong>Target Audience:</strong> ${formData.targetAudience || '[Target Audience]'}</p>`;
        html += `<p><strong>Key Benefit:</strong> ${formData.keyBenefit || '[Key Benefit]'}</p>`;
        html += `<p id="ad-copy-cta">${formData.callToAction || '[Call to Action]'}</p>`; // Use id
        html += `</div>`;
    } else if (contentType === 'email-marketing') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Email Type:</strong> ${formData.emailType || '[Email Type]'}</p>`;
        html += `<p><strong>Subject Line:</strong> ${formData.subjectLine || '[Subject Line]'}</p>`;
        if (formData.preheader) html += `<p><strong>Preheader Text:</strong> ${formData.preheader}</p>`;
        html += `<p id="email-body">${formData.body || '[Body Content]'}</p>`; // Use id
        html += `<p><strong>Call to Action:</strong> ${formData.callToAction || '[Call to Action]'}</p>`;
        html += `</div>`;
    } else if (contentType === 'product-descriptions') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Product Name:</strong> ${formData.productName || '[Product Name]'}</p>`;
        html += `<p><strong>Key Features:</strong> ${formData.keyFeatures || '[Key Features]'}</p>`;
        html += `<p id="product-benefits">${formData.benefits || '[Benefits]'}</p>`; // Use id
        html += `<p><strong>Target Audience:</strong> ${formData.targetAudience || '[Target Audience]'}</p>`;
        html += `</div>`;
    }  else if (contentType === 'business-proposals') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Client Name:</strong> ${formData.clientName || '[Client Name]'}</p>`;
        html += `<p><strong>Project Name:</strong> ${formData.projectName || '[Project Name]'}</p>`;
        html += `<p id="proposal-overview">${formData.projectOverview || '[Project Overview]'}</p>`; // Use id
        if (formData.objectives && formData.objectives.length) {
            html += `<p><strong>Objectives:</strong></p><ul>`;
            formData.objectives.forEach(obj => html += `<li>${obj}</li>`);
            html += `</ul>`;
        }
        html += `<p id="proposal-scope">${formData.scopeOfWork || '[Scope of Work]'}</p>`; // Use id
        if (formData.timeline) html += `<p><strong>Project Timeline:</strong> ${formData.timeline}</p>`;
        if (formData.budget) html += `<p><strong>Budget:</strong> ${formData.budget}</p>`;
        html += `</div>`;
    } else if (contentType === 'website-copy') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Page Type:</strong> ${formData.pageType || '[Page Type]'}</p>`;
        html += `<p><strong>Target Audience:</strong> ${formData.targetAudience || '[Target Audience]'}</p>`;
        html += `<p id="website-message">${formData.keyMessage || '[Key Message]'}</p>`; // Use id
        if (formData.callToAction) html += `<p><strong>Call to Action:</strong> ${formData.callToAction}</p>`;
        html += `</div>`;
    } else if (contentType === 'press-releases') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<p><strong>Headline:</strong> ${formData.headline || '[Headline]'}</p>`;
        html += `<p><strong>Company Name:</strong> ${formData.companyName || '[Company Name]'}</p>`;
        html += `<p><strong>City:</strong> ${formData.city || '[City]'}</p>`;
        html += `<p><strong>State:</strong> ${formData.state || '[State]'}</p>`;
        if (formData.releaseDate) html += `<p><strong>Release Date:</strong> ${formData.releaseDate}</p>`;
        html += `<p id="press-release-body">${formData.body || '[Body Text]'}</p>`; // Use id
        if (formData.contactName) html += `<p><strong>Contact Name:</strong> ${formData.contactName}</p>`;
        if (formData.contactEmail) html += `<p><strong>Contact Email:</strong> ${formData.contactEmail}</p>`;
        if (formData.contactPhone) html += `<p><strong>Contact Phone:</strong> ${formData.contactPhone}</p>`;
        html += `</div>`;
    }
    return DOMPurify.sanitize(html);
}
// Basic markdown
function extractHtmlFromResponse(responseText) {
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