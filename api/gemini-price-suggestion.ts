// Vercel Serverless Function - Price Suggestion
// This keeps the Gemini API key secure on the server side

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const { productName, price, daysUntilExpiry, category } = req.body;

    if (!productName || price === undefined || daysUntilExpiry === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Product: ${productName}
                 Original Price: £${price}
                 Days until expiry: ${daysUntilExpiry}
                 Category: ${category}
                 
                 Suggest a clearance price to ensure it sells before expiry. Return JSON: { "suggestedPrice": number, "reasoning": string }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestedPrice: { type: "number" },
            reasoning: { type: "string" }
          }
        }
      }
    });

    const result = JSON.parse(response.text);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get price suggestion' });
  }
}

