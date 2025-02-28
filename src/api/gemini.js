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
        // Remove business-proposals
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
            const model = genAI.getGenerativeModel({ model: selectedModel, safetySettings });

            // Validate and clean the form data
            const { cleanedData } = validateFormData(formData, contentType);

            // Create prompt based on content type and template
            const prompt = createPrompt(contentType, cleanedData, selectedTemplate); //Use CreatePrompt

            const chat = model.startChat({
                history: [],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            });

            const result = await chat.sendMessageStream(prompt);

            let fullResponse = "";
            for await (const chunk of result.stream) {
                fullResponse += chunk.text();
            }
            return { html: extractHtmlFromResponse(fullResponse) }; // Use the improved function

        } catch (error) {
            console.error("Error in generateContentWithGemini:", error);
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


//Create Prompt
function createPrompt(contentType, formData, template) {
    let prompt = '';

    const templateWrapper = (content) => {
        return `<div class="${contentType} template-${template.toLowerCase()}">${content}</div>`;
    };

    switch (contentType) {
        case 'resume':
            prompt = `Generate HTML for a resume based on the following information, using the ${template} template:

            Full Name: ${formData.fullName}
            Email: ${formData.email}
            Phone: ${formData.phone || 'Not provided'}
            LinkedIn: ${formData.linkedin || 'Not provided'}
            GitHub: ${formData.github || 'Not provided'}
            Summary: ${formData.summary || 'Not provided'}
            Work Experience: ${formData.workExperience?.join('; ') || 'No work experience listed.'}
            Education: ${formData.education?.join('; ') || 'No education listed.'}
            Skills: ${formData.skills?.join(', ') || 'No skills listed.'}

            The output should be valid, semantic HTML, well-formatted, and suitable for direct display in a web browser.  Use appropriate CSS classes for styling (e.g., "resume-section", "work-experience-item").
            `;
            break;

        case 'poster':
            prompt = `Generate HTML for a poster based on the following information, using the ${template} template:
            Title: ${formData.title}
            Subtitle: ${formData.subtitle || ''}
            Body: ${formData.body}
            Call to Action: ${formData.callToAction || ''}
            Contact Information: ${formData.contactInfo || ''}
            The output should be valid, semantic HTML, well-formatted, and suitable for direct display in a web browser. Use appropriate CSS classes.
            `;
            break;

        case 'social-post':
            prompt = `Generate HTML for a ${formData.platform} social media post based on the following:

            Content: ${formData.content}
            Hashtags: ${formData.hashtags?.join(' ') || 'None'}
            Mentions: ${formData.mentions?.map(m => '@' + m).join(' ') || 'None'}
            Tone: ${formData.tone || 'Neutral'}

            Format the output as HTML. Include hashtags and mentions as clickable links (if applicable to the platform - use <a> tags with appropriate classes).  Use <p> tags for paragraphs.  Consider platform-specific formatting (e.g., line breaks). Do not include any introductory or explanatory text.
            `;
            break;
        case 'social-ad-copy':
            prompt = `Generate HTML for a  ${formData.platform} social media ad copy based on the following:

            Product/Service: ${formData.product}
            Target Audience: ${formData.targetAudience}
            Key Benefit: ${formData.keyBenefit}
            Call to Action: ${formData.callToAction}

             Format the output as HTML. Use appropriate CSS classes.
            `;
            break;
        case 'email-marketing':
            prompt = `Generate HTML for a ${formData.emailType} Email Marketing content with this structure:
            
            ${templateWrapper(`
                <div class="email-header">
                    <h1>[Subject Line]</h1>
                    <p class="preheader">[Preheader]</p>
                </div>
                <div class="email-content">
                    [Body Content]
                </div>
                <div class="email-cta">
                    [Call to Action]
                </div>
            `)}

            Use these values:
            Subject Line: ${formData.subjectLine}
            Preheader: ${formData.preheader}
            Body Content: ${formData.body}
            Call to Action: ${formData.callToAction}
            `;
            break;
        case 'product-descriptions':
            prompt = `Generate HTML Product Description with this structure:
            
            ${templateWrapper(`
                <div class="product-header">
                    <h1>[Product Name]</h1>
                </div>
                <div class="product-features">
                    <h2>Key Features</h2>
                    [Features List]
                </div>
                <div class="product-benefits">
                    <h2>Benefits</h2>
                    [Benefits Content]
                </div>
                <div class="product-target">
                    <h2>Perfect For</h2>
                    [Target Audience]
                </div>
            `)}

            Use these values:
            Product Name: ${formData.productName}
            Features: ${formData.keyFeatures}
            Benefits: ${formData.benefits}
            Target Audience: ${formData.targetAudience}
            `;
            break;
        case 'landing-page':
            prompt = `Generate HTML for a landing page based on the following information:
            Headline: ${formData.headline}
            Subheadline: ${formData.subheadline || 'Not provided'}
            Value Proposition: ${formData.valueProposition}
            Features/Benefits: ${formData.features?.join(', ') || 'Not provided'}
            Target Audience: ${formData.targetAudience}
            Primary Call to Action: ${formData.primaryCTA}
            Secondary Call to Action: ${formData.secondaryCTA || 'Not provided'}`
                ;
            break;

        case 'website-copy':
            prompt = `Generate HTML for website copy based on the following data, using the ${template} template:
        
                    Page Type: ${formData.pageType}
                    Target Audience: ${formData.targetAudience}
                    Key Message: ${formData.keyMessage}
                    Call to Action: ${formData.callToAction}
                   
                    The output should be valid, semantic HTML, well-formatted. Use appropriate CSS classes.
                    `;
            break;
        case 'press-releases':
            prompt = `Generate HTML Press Release based on the following information:

    Create a professionally formatted press release with this exact structure:
    
    <div class="press-release">
        <div class="press-release-header">
            <h1>[HEADLINE]</h1>
            <p class="press-release-dateline">[CITY], [STATE] — [RELEASE_DATE]</p>
        </div>
        
        <div class="press-release-body">
            [BODY_CONTENT]
        </div>
        
        <div class="press-release-boilerplate">
            <h3>About [COMPANY_NAME]</h3>
            <p>Google is a global technology leader focused on improving the ways people connect with information.</p>
        </div>
        
        <div class="press-release-contact">
            <h3>Media Contact:</h3>
            <p>[CONTACT_NAME]<br>
            [CONTACT_EMAIL]<br>
            [CONTACT_PHONE]</p>
        </div>
    </div>

    Use these values:
    - Headline: ${formData.headline}
    - Company: ${formData.companyName}
    - Location: ${formData.city}, ${formData.state}
    - Date: ${formData.releaseDate || 'FOR IMMEDIATE RELEASE'}
    - Body: ${formData.body}
    - Contact: ${formData.contactName || 'Media Relations'}
    - Email: ${formData.contactEmail || ''}
    - Phone: ${formData.contactPhone || ''}

    Important:
    1. Keep all [PLACEHOLDER] tags exactly as shown
    2. Do not modify the HTML structure
    3. Use semantic HTML within the body content
    4. Ensure proper paragraph spacing`;
            break;


        default:
            prompt = `Generate content based on: ${JSON.stringify(formData)}`;
    }

    return prompt;
}

function extractHtmlFromResponse(responseText) {
    // Remove any Markdown code block delimiters (```html, ```)
    let html = responseText.replace(/```html|```/g, '').trim();

    // Basic Markdown-like conversions
    html = html
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>') //Fix for continuous list
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