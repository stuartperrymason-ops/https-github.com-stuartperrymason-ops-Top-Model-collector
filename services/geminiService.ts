/**
 * @file geminiService.ts
 * @description This service handles communication with the Google Gemini API.
 * It provides a function to generate flavorful descriptions for models based on their name, army, and game system.
 * This program was written by Stuart Mason October 2025.
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Generates a model description using the Gemini API.
 * @param modelName - The name of the model (e.g., "Primaris Intercessor").
 * @param armyName - The name of the army the model belongs to (e.g., "Space Marines").
 * @param gameSystem - The game system universe (e.g., "Warhammer 40,000").
 * @returns A promise that resolves to the generated description string.
 */
export const generateDescription = async (modelName: string, armyName: string, gameSystem: string): Promise<string> => {
  try {
    // FIX: Per @google/genai coding guidelines, the API key must be sourced directly from process.env.API_KEY.
    // The check for the key's existence has also been removed as per the guidelines,
    // which state to assume the key is pre-configured and accessible.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a detailed prompt to guide the AI. This is a form of "prompt engineering"
    // where we provide clear, structured instructions to get a high-quality, relevant response.
    // The prompt specifies the desired content, structure (two or three paragraphs), and tone.
    const prompt = `Generate a detailed and engaging description for the tabletop miniature model "${modelName}" from the "${armyName}" army in the "${gameSystem}" universe. The description should be two or three paragraphs. Start with its lore and background, then describe its typical role and capabilities on the battlefield. Conclude with a sentence that captures its essence or threat.`;
    
    // Call the Gemini API's generateContent method. This is an asynchronous operation.
    const response = await ai.models.generateContent({
        // 'gemini-2.5-flash' is chosen for its balance of speed and capability, making it
        // suitable for generating descriptive text quickly.
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    // The API response object contains the generated text. We access it via the `.text` property
    // and use `.trim()` to remove any leading/trailing whitespace for a clean output.
    return response.text.trim();
  } catch (error) {
    // If the API call fails for any reason (e.g., network error, invalid key),
    // we catch the error, log it for debugging, and return a user-friendly error message.
    console.error("Error generating description with Gemini API:", error);
    return "Failed to generate description. Please try again later.";
  }
};
