// src/api/gemini.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getDeveloperApiKey } from '@/utils/auth';
import { auth } from '@/api/firebase';
import DOMPurify from 'dompurify';
import pLimit from 'p-limit';

let genAIInstance = null;

const getGenAI = () => {
    if (genAIInstance) return genAIInstance;

    const user = auth.currentUser;
    const developerApiKey = getDeveloperApiKey();

    if (user || developerApiKey) {
        genAIInstance = new GoogleGenerativeAI(developerApiKey || import.meta.env.VITE_GEMINI_API_KEY);
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
                            description: "The type of content to generate",
                            enum: ["resume", "poster", "social-post", "social-ad-copy", "email-marketing",
                                "product-descriptions", "landing-page", "website-copy", "press-releases"] // Replace business-proposals with landing-page
                        },
                        formData: {
                            type: "object",
                            description: "An object containing the data to use for content generation.",
                            properties: {
                                // Website copy specific fields
                                pageType: { type: "string" },
                                targetAudience: { type: "string" },
                                keyMessage: { type: "string" },
                                callToAction: { type: "string" },
                                // Common required fields
                                title: { type: "string" },
                                content: { type: "string" },
                                body: { type: "string" },
                                platform: { type: "string" }
                                // Remove array fields from required schema
                            },
                            required: ["title", "content", "body"] // Remove platform from required fields
                        },
                        selectedTemplate: { type: "string" }
                    },
                    required: ["contentType", "formData", "selectedTemplate"]
                }
            }
        ]
    }
];


const validateFormData = (formData, contentType) => {
    // Website-copy specific validation
    if (contentType === 'website-copy') {
        return {
            cleanedData: {
                // Required fields
                title: formData.pageType || '',
                content: formData.keyMessage || '',
                body: formData.targetAudience || '',
                callToAction: formData.callToAction || '',
                // Optional fields
                pageType: formData.pageType || '',
                targetAudience: formData.targetAudience || '',
                keyMessage: formData.keyMessage || '',
                // Remove arrays and platform field since they're not needed for website-copy
            },
            validEnhanceFlags: [] // Remove enhance flags from API request
        };
    }

    // Base fields allowed for all content types
    const allowedFields = {
        'resume': [
            'fullName', 'email', 'phone', 'linkedin', 'github',
            'summary', 'workExperience', 'education', 'skills'
        ],
        'poster': [
            'title', 'subtitle', 'body', 'callToAction', 'contactInfo'
        ],
        'social-post': [
            'platform', 'content', 'hashtags', 'mentions'
        ],
        'landing-page': [
            'headline', 'subheadline', 'valueProposition', 'features',
            'targetAudience', 'primaryCTA', 'secondaryCTA', 'socialProof'
        ],
        // ...other content types...
    };

    // Get allowed fields for this content type
    const validFields = allowedFields[contentType] || [];

    // Clean the form data to only include valid fields
    const cleanedData = {};
    for (const field of validFields) {
        if (formData[field] !== undefined) {
            cleanedData[field] = formData[field];
        }
    }

    return { cleanedData, validEnhanceFlags: {} };
};

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
const limit = pLimit(10);
export async function generateContentWithGemini(formData, selectedTemplate, selectedModel, contentType) {
    return limit(async () => {
        try {
            if (!selectedTemplate) {
                throw new Error("Please select a template before generating content");
            }

            const genAI = getGenAI();
            // Remove tools for models that don't support function calling
            const modelConfig = {
                model: selectedModel,
                safetySettings
            };

            // Only add tools for models that support function calling
            if (selectedModel === 'gemini-2.0-pro-exp-02-05') {
                modelConfig.tools = tools;
            }

            const model = genAI.getGenerativeModel(modelConfig);

            // Validate and clean the form data
            const { cleanedData } = validateFormData(formData, contentType);

            // Create prompt based on content type and template
            const prompt = createPromptForModel(contentType, cleanedData, selectedTemplate);

            // Send request with proper content type headers
            const chat = model.startChat({
                history: [],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            });

            // Send message without function calling for non-supporting models
            const result = await chat.sendMessageStream([
                { text: prompt }
            ]);

            let fullResponse = "";

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
            }

            // Process response
            return { html: extractHtmlFromResponse(fullResponse) };

        } catch (error) {
            console.error("Error in generateContentWithGemini:", error);
            if (error.message.includes("Function calling is not enabled")) {
                throw new Error("Selected model doesn't support all features. Please try a different model.");
            }
            // Complete error handling section:
            if (error.message.includes("400")) {
                throw new Error("Invalid request format. Please check your input data.");
            }
            if (error.message.includes("401")) {
                throw new Error("Invalid API key. Please check your credentials.");
            }
            if (error.message.includes("429")) {
                throw new Error("Rate limit exceeded. Please try again later.");
            }
            if (error.message.includes("500")) {
                throw new Error("AI service error. Please try again later.");
            }
            throw new Error("Failed to generate content. Please try again.");
        }
    });
}

function createPromptForModel(contentType, formData, template) {
    let prompt = `Generate ${contentType} content using the following data:\n\n`;
    
    if (contentType === 'social-post') {
        prompt = `Create an engaging social media post for ${formData.platform} with the following guidelines:
- Write in a ${formData.tone || 'professional'} tone
- Include emojis where appropriate
- Make the content engaging and shareable
- Format properly for ${formData.platform} best practices
- Maximum length: ${formData.platform === 'Twitter' ? '280 characters' : '2200 characters'}

Content to enhance: ${formData.content}

${formData.hashtags?.length ? 'Hashtags to include: ' + formData.hashtags.join(' ') : ''}
${formData.mentions?.length ? 'Mentions to include: ' + formData.mentions.map(m => '@' + m).join(' ') : ''}

Generate HTML with clear structure and formatting suitable for ${formData.platform}.\n`;
    } else {
        prompt += `Template: ${template}\n`;
        prompt += `Content Type: ${contentType}\n\n`;
        prompt += `Data:\n${JSON.stringify(formData, null, 2)}\n\n`;
        prompt += "Please generate valid HTML content following these guidelines:\n";
        prompt += "1. Use semantic HTML5 elements\n";
        prompt += "2. Include appropriate classes for styling\n";
        prompt += "3. Ensure content is well-structured and formatted\n";
    }
    
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