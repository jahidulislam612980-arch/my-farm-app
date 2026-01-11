
import { DailyRecord, User } from '../types';
import { GoogleGenAI } from "@google/genai";

// Flask ব্যাকএন্ডের URL একটি এনভায়রনমেন্ট ভেরিয়েবল থেকে লোড করা হবে
// Netlify-তে ডিপ্লয় করার সময় এই ভেরিয়েবলটি সেট করতে হবে
const BASE_API_URL = process.env.REACT_APP_FLASK_API_URL || 'http://localhost:5000'; // লোকাল ডেভেলপমেন্টের জন্য ফলব্যাক

// Initialize Gemini AI (ensure API_KEY is available in the environment)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// apiService এখন ব্যাকএন্ডের সাথে HTTP রিকোয়েস্টের মাধ্যমে যোগাযোগ করবে
export const apiService = {
  // লগইন অংশ অপরিবর্তিত থাকবে, কারণ Google Sheets সরাসরি প্রমাণীকরণের জন্য নয়।
  // এটি ফ্রন্টএন্ডে একটি মক প্রমাণীকরণ হিসাবে কাজ করবে।
  async login(username: string, password: string): Promise<User | null> {
    if (username === 'farmowner' && password === 'password') {
      return { username: 'farmowner' };
    }
    throw new Error('Invalid credentials');
  },

  async saveDailyRecord(record: DailyRecord): Promise<DailyRecord> {
    console.log('API: Saving daily record to backend', record);
    const response = await fetch(`${BASE_API_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to save record: ${errorData.error || errorData.message || 'Unknown error'}`);
    }
    return response.json(); // ব্যাকএন্ড সেভ করা রেকর্ড ফেরত দেবে
  },

  async fetchDailyRecords(): Promise<DailyRecord[]> {
    console.log('API: Fetching daily records from backend');
    const response = await fetch(`${BASE_API_URL}/records`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to fetch records: ${response.status} ${errorData.error || errorData.message || 'Unknown error'}`);
    }
    return response.json();
  },

  async updateDailyRecord(updatedRecord: DailyRecord): Promise<DailyRecord> {
    console.log('API: Updating daily record via backend', updatedRecord);
    const response = await fetch(`${BASE_API_URL}/records/${updatedRecord.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedRecord),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to update record: ${errorData.error || errorData.message || 'Unknown error'}`);
    }
    return response.json(); // ব্যাকএন্ড আপডেট করা রেকর্ড ফেরত দেবে
  },

  async deleteDailyRecord(id: string): Promise<void> {
    console.log('API: Deleting daily record via backend with ID:', id);
    const response = await fetch(`${BASE_API_URL}/records/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed to delete record: ${errorData.error || errorData.message || 'Unknown error'}`);
    }
    // Delete সফল হলে সাধারণত 204 No Content ফেরত দেয়, তাই json() পার্স করার দরকার নেই
  },

  async analyzeDailyRecordWithGemini(record: DailyRecord, lang: 'en' | 'bn'): Promise<string> {
    // Determine language-specific prompt
    const promptLang = lang === 'bn' ? 'Bengali' : 'English';
    const analysisRequest = `Analyze the following poultry farm daily record and provide a brief summary of key insights or observations, potential issues, or positive aspects. Focus on production efficiency, cost management, and flock health. Respond in ${promptLang}.

Daily Record for ${record.date}:
- Crates Produced: ${record.cratesProduced}
- Egg Price per Piece: $${record.eggPricePerPiece}
- Feed Bags Used: ${record.feedBagsUsed}
- Feed Total Cost: $${record.feedTotalCost}
- Medicine Used: ${record.medicineName || 'None'}
- Medicine Cost: $${record.medicineCost}
- Total Chickens: ${record.totalChickens}
- Laying Chickens: ${record.layingChickens}
- Non-Laying Chickens: ${record.nonLayingChickens}

Provide analysis in a concise, paragraph format.`;

    try {
      console.log('Sending to Gemini for fast analysis:', analysisRequest);
      // Changed model name from gemini-2.5-flash-lite to gemini-flash-lite-latest
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest', // Using Flash-Lite for low-latency, fast responses
        contents: [{ parts: [{ text: analysisRequest }] }],
        config: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 250,
        },
      });
      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }
      return text;
    } catch (error: any) {
      console.error('Error calling Gemini API for daily analysis:', error);
      throw new Error(`Gemini analysis failed: ${error.message || 'Unknown error'}`);
    }
  },

  async analyzeAnomalyWithGemini(anomalyDescription: string, lang: 'en' | 'bn'): Promise<string> {
    const promptLang = lang === 'bn' ? 'Bengali' : 'English';
    const anomalyPrompt = `An anomaly has been detected in the poultry farm data: ${anomalyDescription}. Provide a detailed explanation of what this might indicate, potential causes, and actionable recommendations for the farm owner. Be comprehensive and respond in ${promptLang}.`;

    try {
      console.log('Sending to Gemini for anomaly analysis (gemini-3-pro-preview):', anomalyPrompt);
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Using Pro for more complex reasoning for anomalies
        contents: [{ parts: [{ text: anomalyPrompt }] }],
        config: {
          temperature: 0.8,
          topP: 0.95,
          topK: 60,
          maxOutputTokens: 400, // Allow for a more detailed response
        },
      });
      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty anomaly analysis response.');
      }
      return text;
    } catch (error: any) {
      console.error('Error calling Gemini API for anomaly analysis:', error);
      throw new Error(`Gemini anomaly analysis failed: ${error.message || 'Unknown error'}`);
    }
  },

  async getMarketInsightsWithGemini(
    monthYear: string,
    lang: 'en' | 'bn'
  ): Promise<{ text: string; sources: string[] }> {
    const promptLang = lang === 'bn' ? 'Bengali' : 'English';
    const requestPrompt = `Based on the month ${monthYear}, what are the average market prices for eggs (per piece) and common poultry feed (per bag) in the current market? Also, provide some general market trends or news for poultry products if available. Use Google Search to find up-to-date information. Summarize the findings concisely and mention the sources. Respond in ${promptLang}.`;

    try {
      console.log('Sending to Gemini for market insights with Google Search:', requestPrompt);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using Flash with Google Search tool
        contents: [{ parts: [{ text: requestPrompt }] }],
        config: {
          tools: [{ googleSearch: {} }], // Enable Google Search grounding
          temperature: 0.5,
          topP: 0.8,
          topK: 30,
          maxOutputTokens: 300,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response for market insights.');
      }

      const sources: string[] = [];
      response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push(chunk.web.uri);
        }
      });

      return { text, sources };
    } catch (error: any) {
      console.error('Error calling Gemini API for market insights:', error);
      throw new Error(`Gemini market insights failed: ${error.message || 'Unknown error'}`);
    }
  },
};
