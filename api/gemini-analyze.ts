// Vercel Serverless Function - Image Analysis
// This keeps the Gemini API key secure on the server side

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server-side environment variable (not VITE_ prefixed)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const { imageData, mimeType } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageData } },
          { text: "Analyze this retail product image. Extract the Barcode (numbers), the Expiry Date (YYYY-MM-DD), the Product Name, and Category. If you can't clearly see the date, estimate or leave null." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            barcode: { type: "string" },
            expiryDate: { type: "string" },
            productName: { type: "string" },
            category: { type: "string" },
          },
          required: ["barcode"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
}

