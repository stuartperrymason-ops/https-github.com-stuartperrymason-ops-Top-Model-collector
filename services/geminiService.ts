/**
 * @file geminiService.ts
 * @description This service handles communication with the Google Gemini API.
 * It provides a function to generate flavorful descriptions for models based on their name, army, and game system.
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Generates a model description using the Gemini API.
 * @param modelName - The name of the model.
 * @param armyName - The name of the army the model belongs to.
 * @param gameSystem - The game system universe.
 * @returns A promise that resolves to the generated description string.
 */
export const generateDescription = async (modelName: string, armyName: string, gameSystem: string): Promise<string> => {
  // Ensure the API key is available from environment variables before proceeding.
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    return "API key not configured. Please set the API_KEY environment variable.";
  }
  
  try {
    // Initialize the Google GenAI client.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a detailed prompt to guide the AI in generating a relevant and thematic description.
    const prompt = `Generate a short, flavorful, one-paragraph description for the tabletop miniature model "${modelName}" from the "${armyName}" army in the "${gameSystem}" universe. Focus on its role on the battlefield or its lore.`;
    
    // Call the Gemini API to generate content.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using a fast and efficient model suitable for this task.
        contents: prompt,
    });
    
    // Extract and return the text from the response.
    return response.text.trim();
  } catch (error) {
    // Basic error handling in case the API call fails.
    console.error("Error generating description with Gemini API:", error);
    return "Failed to generate description. Please try again later.";
  }
};
