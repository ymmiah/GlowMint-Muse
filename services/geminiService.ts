import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio, GenerationModel } from "../types";

// Helper to get a fresh client instance.
// Critical for handling API key changes dynamically (e.g. user selects a paid project).
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Chat with Gemini for ideation.
 * Supports Multimodal input (text + image).
 */
export const sendChatMessage = async (
  message: string,
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  attachmentBase64?: string
): Promise<string> => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: "You are the 'GlowMint Muse', a creative AI assistant for 'GlowMint Muse' platform. Help users brainstorm artistic concepts, suggest prompts, and refine their visual ideas. Be concise, encouraging, and visually descriptive. \n\nIMPORTANT: When you suggest a specific prompt for image generation, you MUST wrap the prompt text in a markdown code block labeled 'prompt'. \nExample:\n```prompt\nA futuristic city with glowing neon lights, cyberpunk style, digital art\n```\nDo not put conversational text inside the prompt block. If the user asks to generate an image, describe exactly what the prompt should be inside this block.",
      },
    });

    let msgContent: any = message;

    // Handle Multimodal Input
    if (attachmentBase64) {
      const base64Data = attachmentBase64.split(',')[1];
      const mimeType = attachmentBase64.split(';')[0].split(':')[1];
      
      msgContent = [
        { text: message || "Analyze this image." }, // Ensure text part exists
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ];
    }

    const result = await chat.sendMessage({ message: msgContent });
    return result.text || "I'm having trouble thinking of a response right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error connecting to the creative mind.";
  }
};

/**
 * Generate an image using Gemini 2.5 Flash Image or Gemini 3 Pro Image.
 */
export const generateImage = async (
  prompt: string,
  model: GenerationModel,
  aspectRatio: AspectRatio,
  negativePrompt?: string
): Promise<string | null> => {
  try {
    const ai = getAI();
    // Construct the prompt with negative prompt if present
    let fullPrompt = prompt;
    if (negativePrompt) {
      fullPrompt += `\n\n(Negative Prompt: ${negativePrompt})`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: model === GenerationModel.Pro ? "2K" : undefined, // Pro supports higher res
        },
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

/**
 * Refine/Edit an image using multimodal input (Image + Text).
 * Used for "Self-Correction" or "Semantic Editing".
 */
export const refineImage = async (
  base64Image: string,
  instruction: string,
  model: GenerationModel = GenerationModel.Flash
): Promise<string | null> => {
  try {
    const ai = getAI();
    // Remove header to get pure base64
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];

    const response = await ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: instruction,
          },
        ],
      },
      // Note: imageConfig might be restricted in multimodal edit contexts depending on model version,
      // but passing standard config usually defaults safely.
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;

  } catch (error) {
    console.error("Refine Image Error:", error);
    throw error;
  }
};

/**
 * Analyze an image to provide tags/critique (Critique Loop).
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
    try {
        const ai = getAI();
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.split(';')[0].split(':')[1];
    
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash", // Good for vision analysis
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: "Analyze this image. Provide a comma-separated list of 5 stylistic tags, followed by a brief 1-sentence critique of the composition or anatomy.",
              },
            ],
          },
        });
    
        return response.text || "Could not analyze image.";
      } catch (error) {
        console.error("Analysis Error:", error);
        return "Error analyzing image.";
      }
}