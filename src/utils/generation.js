// src/utils/generation.js
import { encode } from 'gpt-tokenizer';
import { auth } from '@/api/firebase';
import { generateContentWithGemini } from '@/api/gemini'; // Import from the new location
import { useFirebase } from "@/composables/useFirebase"; // Import the composable


async function generateContent(formData, selectedTemplate, selectedModel, contentType) {
    const { updateGenerationData } = useFirebase(); // Get updateGenerationData
    try {
        const result = await generateContentWithGemini(formData, selectedTemplate, selectedModel, contentType);

        // Get current user ID
        const userId = auth.currentUser?.uid;

        // Calculate token usage *before* updating generation data
        const inputText = JSON.stringify(formData); // Approximate input
        const outputText = result.html;
        const inputTokenCount = encode(inputText).length;
        const outputTokenCount = encode(outputText).length;
        const totalTokens = inputTokenCount + outputTokenCount;

        // Call the combined update function.
        if (userId) {  // Only update if user is logged in.
            await updateGenerationData(userId, selectedModel, totalTokens);
        }

        return result; // Return the result object (with .html)

    } catch (error) {
        console.error("Error generating content:", error);
        if (error.message.includes("400")) {
            throw new Error("Invalid request to the AI model. Please check your input data.");
        } else if (error.message.includes("429")) {
            throw new Error("Too many requests to the AI model. Please try again later.");
        } else if (error.message.includes("500")) {
            throw new Error("Internal Server to the AI model. Please try again later");
        } else {
            throw new Error("Failed to generate content. Please check your API key and network connection, or try again later.");
        }
    }
}

export { generateContent };