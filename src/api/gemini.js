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
                                "product-descriptions", "business-proposals", "website-copy", "press-releases"]
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
            const model = genAI.getGenerativeModel({ model: selectedModel, tools, safetySettings });

            // Validate and clean the form data
            const { cleanedData } = validateFormData(formData, contentType);


            const generateRequest = {
                contentType,
                formData: cleanedData,
                selectedTemplate
            };

            // Send request with proper content type headers
            const chat = model.startChat({
                history: [],
                tools,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            });

            // Correct message format for Gemini API
            const result = await chat.sendMessageStream([
                { text: JSON.stringify(generateRequest) }
            ]);

            let fullResponse = "";

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
            }

            // Try parsing as JSON first
            try {
                const parsedResponse = JSON.parse(fullResponse);
                if (parsedResponse?.candidates?.[0]?.content?.parts?.[0]?.functionResponse?.response?.html) {
                    return { html: parsedResponse.candidates[0].content.parts[0].functionResponse.response.html };
                }
                if (parsedResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return { html: extractHtmlFromResponse(parsedResponse.candidates[0].content.parts[0].text) };
                }
            } catch (parseError) {
                // If not JSON, treat as plain text/markdown
                if (fullResponse.trim()) {
                    return { html: extractHtmlFromResponse(fullResponse) };
                }
            }

            throw new Error("Invalid or empty response from Gemini");

        } catch (error) {
            console.error("Error in generateContentWithGemini:", error);
            // Add more specific error handling
            if (error.message.includes("400")) {
                throw new Error("Invalid request format. Please check your input data.");
            }
            if (error.message.includes("500")) {
                throw new Error("The AI service is temporarily unavailable. Please try again.");
            }
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    });
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