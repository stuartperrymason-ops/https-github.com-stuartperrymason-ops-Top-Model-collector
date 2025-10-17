
import { GoogleGenAI } from "@google/genai";

export const generateDescription = async (modelName: string, armyName: string, gameSystem: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    return "API key not configured. Please set the API_KEY environment variable.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a short, flavorful, one-paragraph description for the tabletop miniature model "${modelName}" from the "${armyName}" army in the "${gameSystem}" universe. Focus on its role on the battlefield or its lore.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description with Gemini API:", error);
    return "Failed to generate description. Please try again later.";
  }
};
