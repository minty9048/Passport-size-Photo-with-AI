import { GoogleGenAI } from "@google/genai";
import { DocType, DOC_CONFIGS, OutfitOption, BgColorOption } from "../types";

const processImageWithGemini = async (
  base64Image: string,
  docType: DocType,
  outfit: OutfitOption,
  bgColor: BgColorOption
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash-image";
  
  const config = DOC_CONFIGS[docType];

  // Map background colors to hex/descriptions
  const bgMap: Record<BgColorOption, string> = {
    white: "CLEAN, SOLID PURE WHITE (Hex #FFFFFF)",
    light_blue: "Professional Light Blue (Hex #D0E0FF)",
    light_gray: "Professional Light Gray (Hex #E0E0E0)"
  };

  // Map outfits to prompt descriptions
  const outfitPromptMap: Record<OutfitOption, string> = {
    original: "Keep the person's original clothing exactly as it is. Do not modify the outfit.",
    suit_male: "Change the person's outfit to a professional dark navy blue business suit with a white shirt and a tie. Ensure the fit looks natural on the shoulders and neck.",
    suit_female: "Change the person's outfit to a professional black formal blazer with a white inner blouse. Ensure the fit looks natural.",
    shirt_white: "Change the person's outfit to a crisp, clean white formal button-down shirt."
  };
  
  const prompt = `
    Act as a professional photo editor for official government documents.
    Task: Transform the provided image into a compliant Indian Passport photo.
    
    CRITICAL INSTRUCTIONS:
    1. BACKGROUND: Remove the original background. Replace it with a ${bgMap[bgColor]}. There should be NO shadows on the background wall.
    2. OUTFIT CHANGE: ${outfitPromptMap[outfit]}
    3. CROP & COMPOSITION: Crop the image to a square aspect ratio (1:1). Center the head horizontally. The head (from top of hair to bottom of chin) must occupy approximately ${config.faceSizePercent}% of the image height.
    4. RETOUCHING: Improve lighting to be flat and even. Remove red-eye. Ensure the skin tone looks natural.
    5. IDENTITY PRESERVATION (MOST IMPORTANT): Do NOT alter facial features, nose shape, eye shape, or hair style (unless it obscures the face). The person must remain clearly recognizable. Only the clothing and background should change.
    
    Output: Return ONLY the final processed image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    });

    // Extract the image from the response
    let resultBase64 = null;
    
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          resultBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!resultBase64) {
      throw new Error("Gemini did not return an image. Please try a different photo or prompt.");
    }

    return resultBase64;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export { processImageWithGemini };