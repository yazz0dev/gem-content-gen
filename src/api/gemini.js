import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getDeveloperApiKey } from '@/utils/auth';
import { auth } from '@/api/firebase';
import DOMPurify from 'dompurify';
import pLimit from 'p-limit';

// Instead of initializing immediately, create a function to get or create the API client
let genAIInstance = null;

const getGenAI = () => {
    if (genAIInstance) return genAIInstance;

    const user = auth.currentUser;
    const developerApiKey = getDeveloperApiKey();

    if (user) {
        genAIInstance = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    } else if (developerApiKey) {
        genAIInstance = new GoogleGenerativeAI(developerApiKey);
    } else {
        throw new Error("Please sign in or provide a developer API key.");
    }

    return genAIInstance;
};

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
                            enum: ["resume", "poster", "social-post", "social-ad-copy", "email-marketing", 
                                 "product-descriptions", "business-proposals", "website-copy", "press-releases"]
                        },
                        formData: {
                            type: "object",
                            description: "An object containing the data to use for content generation.",
                            properties: {
                                // Resume properties
                                fullName: { type: "string" },
                                email: { type: "string" },
                                phone: { type: "string" },
                                linkedin: { type: "string" },
                                github: { type: "string" },
                                summary: { type: "string" },
                                workExperience: { 
                                    type: "array",
                                    items: { type: "string" }
                                },
                                education: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                skills: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                // Poster properties
                                title: { type: "string" },
                                subtitle: { type: "string" },
                                body: { type: "string" },
                                callToAction: { type: "string" },
                                contactInfo: { type: "string" },
                                // Social post properties
                                platform: { type: "string" },
                                content: { type: "string" },
                                hashtags: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                mentions: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        },
                        selectedTemplate: {
                            type: "string",
                            description: "Name of template to use."
                        },
                        instructions: {
                            type: "string",
                            description: "Additional instructions (optional)."
                        },
                        enhanceFlags: {
                            type: "object",
                            description: "Object containing keys for enhanced content",
                            properties: {
                                summaryEnhance: { type: "boolean" },
                                workExperienceEnhance: { type: "boolean" },
                                educationEnhance: { type: "boolean" },
                                skillsEnhance: { type: "boolean" },
                                bodyEnhance: { type: "boolean" },
                                contentEnhance: { type: "boolean" },
                                titleEnhance: { type: "boolean" },
                                benefitsEnhance: { type: "boolean" },
                                projectOverviewEnhance: { type: "boolean" },
                                scopeOfWorkEnhance: { type: "boolean" },
                                keyMessageEnhance: { type: "boolean" }
                            }
                        }
                    },
                    required: ["contentType", "formData", "selectedTemplate"]
                }
            }
        ]
    }
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


// Concurrency limit
const limit = pLimit(10); // Limit to 10 concurrent requests (adjust based on your needs and Gemini API limits)

export async function generateContentWithGemini(formData, selectedTemplate, selectedModel, contentType) {
    return limit(async () => {
        try {
            // Validate required fields based on content type
            if (contentType === 'email-marketing') {
                if (!formData.emailType) throw new Error("Email type is required");
                if (!formData.subjectLine) throw new Error("Subject line is required");
                if (!formData.body) throw new Error("Email body is required");
                
                // Ensure formData is properly structured
                formData = {
                    ...formData,
                    emailType: formData.emailType || '',
                    subjectLine: formData.subjectLine || '',
                    preheader: formData.preheader || '',
                    body: formData.body || '',
                    callToAction: formData.callToAction || ''
                };
            }
            // Add similar validation for other content types...

            if (!selectedTemplate) {
                throw new Error("Please select a template before generating content");
            }

            const genAI = getGenAI(); // Get the API client when needed
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

                            // Pass enhanceFlags to constructHtmlFromArgs
                            const generatedHtml = constructHtmlFromArgs(args, selectedTemplate, enhanceFlags);
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

            // Provide more specific error messages where possible
            if (error.message) {
                throw new Error(`Failed to generate content: ${error.message}`);
            } else {
                throw new Error(`Failed to generate content: An unknown error occurred.`);
            }

        }
    });
}

// Helper function to construct the HTML, now taking enhanceFlags
function constructHtmlFromArgs(args, selectedTemplate, enhanceFlags) {
    const { contentType, formData, instructions } = args;
    let html = '';

    // Helper functions for enhanced content
    const maybeAddEnhancedContent = (content, key) => {
        if (enhanceFlags[`${key}Enhance`]) {
            return `<span class="enhanced">${content}</span>`;
        }
        return content;
    };

    // Helper for optional fields
    const addOptionalField = (label, value, id = null) => {
        if (value) {
          const idAttr = id ? ` id="${id}"` : '';
          return `<p${idAttr}><strong>${label}:</strong> ${maybeAddEnhancedContent(value, id || label.toLowerCase().replace(/\s+/g, ''))}</p>`;
        }
        return '';
    };

    if (contentType === 'resume') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`; // Apply template class
        html += `<h1 id="name">${maybeAddEnhancedContent(formData.fullName || '[Full Name]', 'fullName')}</h1>`; // Use id for editor targeting
        html += addOptionalField('Email', formData.email, 'email');
        html += addOptionalField('Phone', formData.phone, 'phone');
        if (formData.linkedin) html += `<p>LinkedIn: <a href="${formData.linkedin}" target="_blank">${formData.linkedin}</a></p>`;
        if (formData.github) html += `<p>GitHub: <a href="${formData.github}" target="_blank">${formData.github}</a></p>`;

        if (formData.summary) html += `<div class="resume-summary"><p>${maybeAddEnhancedContent(formData.summary, 'summary')}</p></div>`;

        if (formData.workExperience && formData.workExperience.length) {
            html += `<div class="work-experience"><h2>Work Experience</h2>`;
            formData.workExperience.forEach(exp => {
                const [company, title, dates, responsibilities] = exp.split(',').map(item => item.trim());
                html += `<div class="experience-item">
                            <h3>${maybeAddEnhancedContent(title || '[Title]', 'workExperience')} at ${maybeAddEnhancedContent(company || '[Company]', 'workExperience')}</h3>
                            <p>${maybeAddEnhancedContent(dates || '[Dates]', 'workExperience')}</p>
                            <p>${maybeAddEnhancedContent(responsibilities || '[Responsibilities]', 'workExperience')}</p>
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
                            <h3>${maybeAddEnhancedContent(degree || '[Degree]', 'education')} at ${maybeAddEnhancedContent(institution || '[Institution]', 'education')}</h3>
                            <p>${maybeAddEnhancedContent(dates || '[Dates]', 'education')}</p>
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
                html += `<li>${maybeAddEnhancedContent(skill, 'skills')}</li>`;
            });
            html += `</ul></div>`;
        }
        if (!formData.skills?.length) {
            html += `<div class="skills-section">No skills listed.</div>`;
        }

        html += `</div>`; // Close template container

    } else if (contentType === 'poster') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += `<h1 id="poster-title">${maybeAddEnhancedContent(formData.title || '[Title]', 'title')}</h1>`; // Use id
        if (formData.subtitle) html += `<h2 id="poster-subtitle">${formData.subtitle}</h2>`;
        html += `<p id="poster-body">${maybeAddEnhancedContent(formData.body || '[Body Text]', 'body')}</p>`; // Use id
        if (formData.callToAction) html += `<p id="poster-cta">${formData.callToAction}</p>`;
        if (formData.contactInfo) html += `<p id="poster-contact">${formData.contactInfo}</p>`;
        html += `</div>`;
    }
    else if (contentType === 'social-post') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Platform', formData.platform);
        html += `<p id="social-post-content">${maybeAddEnhancedContent(formData.content || '[Post Content]', 'content')}</p>`; // Use id
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
        html += addOptionalField('Platform', formData.platform);
        html += addOptionalField('Product/Service', formData.product);
        html += addOptionalField('Target Audience', formData.targetAudience);
        html += addOptionalField('Key Benefit', formData.keyBenefit);
        html += `<p id="ad-copy-cta">${maybeAddEnhancedContent(formData.callToAction || '[Call to Action]', 'callToAction')}</p>`; // Use id
        html += `</div>`;
    } else if (contentType === 'email-marketing') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Email Type', formData.emailType);
        html += addOptionalField('Subject Line', formData.subjectLine);
        if (formData.preheader) html += `<p><strong>Preheader Text:</strong> ${formData.preheader}</p>`;
        html += `<p id="email-body">${maybeAddEnhancedContent(formData.body || '[Body Content]', 'body')}</p>`; // Use id
        html += addOptionalField('Call to Action', formData.callToAction);
        html += `</div>`;
    } else if (contentType === 'product-descriptions') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Product Name', formData.productName);
        html += addOptionalField('Key Features', formData.keyFeatures);
        html += `<p id="product-benefits">${maybeAddEnhancedContent(formData.benefits || '[Benefits]', 'benefits')}</p>`; // Use id
        html += addOptionalField('Target Audience', formData.targetAudience);
        html += `</div>`;
    } else if (contentType === 'business-proposals') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Client Name', formData.clientName);
        html += addOptionalField('Project Name', formData.projectName);
        html += `<p id="proposal-overview">${maybeAddEnhancedContent(formData.projectOverview || '[Project Overview]', 'projectOverview')}</p>`; // Use id
        if (formData.objectives && formData.objectives.length) {
            html += `<p><strong>Objectives:</strong></p><ul>`;
            formData.objectives.forEach(obj => html += `<li>${obj}</li>`);
            html += `</ul>`;
        }
        html += `<p id="proposal-scope">${maybeAddEnhancedContent(formData.scopeOfWork || '[Scope of Work]', 'scopeOfWork')}</p>`; // Use id
        if (formData.timeline) html += addOptionalField('Project Timeline', formData.timeline);
        if (formData.budget) html += addOptionalField('Budget', formData.budget);
        html += `</div>`;
    } else if (contentType === 'website-copy') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Page Type', formData.pageType);
        html += addOptionalField('Target Audience', formData.targetAudience);
        html += `<p id="website-message">${maybeAddEnhancedContent(formData.keyMessage || '[Key Message]', 'keyMessage')}</p>`; // Use id
        if (formData.callToAction) html += addOptionalField('Call to Action', formData.callToAction);
        html += `</div>`;
    } else if (contentType === 'press-releases') {
        html += `<div class="template-${selectedTemplate.toLowerCase()}">`;
        html += addOptionalField('Headline', formData.headline);
        html += addOptionalField('Company Name', formData.companyName);
        html += addOptionalField('City', formData.city);
        html += addOptionalField('State', formData.state);
        if (formData.releaseDate) html += addOptionalField('Release Date', formData.releaseDate);
        html += `<p id="press-release-body">${maybeAddEnhancedContent(formData.body || '[Body Text]', 'body')}</p>`; // Use id
        if (formData.contactName) html += addOptionalField('Contact Name', formData.contactName);
        if (formData.contactEmail) html += addOptionalField('Contact Email', formData.contactEmail);
        if (formData.contactPhone) html += addOptionalField('Contact Phone', formData.contactPhone);
        html += `</div>`;
    }
    return DOMPurify.sanitize(html);
}

// Basic markdown
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