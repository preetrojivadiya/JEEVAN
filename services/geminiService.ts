import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const parseMedicalReport = async (imageFile: File) => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = `
    Analyze this medical report/health document. Extract values for the following fields if present.
    Return a RAW JSON object (no markdown) matching this structure. Use 0 if a value is not found.
    
    Structure:
    {
      "nutrients": {
         "vitamins": { "A": number, "D": number, "E": number, "K": number, "B1": number, "B2": number, "B12": number, "C": number },
         "minerals": { "Calcium": number, "Iron": number, "Zinc": number, "Magnesium": number }
      },
      "organs": {
         "heart": { "bpSystolic": number, "bpDiastolic": number, "cholesterol": number, "bmi": number },
         "liver": { "alt": number, "ast": number, "bilirubin": number },
         "lungs": { "fvc": number, "fev1": number }
      },
      "other": {
         "bio": { "weight": number, "height": number }
      }
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json"
      }
    });

    return response.text ? JSON.parse(cleanJson(response.text)) : null;
  } catch (error) {
    console.error("Medical report analysis failed:", error);
    return null;
  }
};

export const analyzeFoodEntry = async (instruction: string, imageFile: File) => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `${instruction}. Return a JSON object with keys: description, calories, protein, fats, carbs.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        });

        return response.text ? JSON.parse(cleanJson(response.text)) : null;
    } catch (error) {
        console.error("Food analysis failed:", error);
        return null;
    }
};

export const searchFoodDatabase = async (query: string) => {
    try {
        const prompt = `Search for food items matching "${query}". Return a JSON array of 5 items. Each item should have: name, calories, protein, fats, carbs. Approximate values per serving.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(cleanJson(response.text)) : [];
    } catch (error) {
        console.error("Food search failed:", error);
        return [];
    }
};

export const parseFoodDescription = async (text: string) => {
    try {
        const prompt = `Analyze this meal description: "${text}". Break it down into individual items. Return a JSON array where each item has: description, calories, protein, fats, carbs.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(cleanJson(response.text)) : [];
    } catch (error) {
        console.error("Food description parsing failed:", error);
        return [];
    }
};

export const searchActivityDatabase = async (query: string) => {
    try {
        const prompt = `Search for physical activities/exercises matching "${query}". Return a JSON array of 5 items. Each item should have: name, calories (burn per rep or minute, specify unit in name if needed, but return number here), fats (fat burn in grams per rep/min, approx), unit (string, e.g. 'rep' or 'min').`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(cleanJson(response.text)) : [];
    } catch (error) {
        console.error("Activity search failed:", error);
        return [];
    }
};