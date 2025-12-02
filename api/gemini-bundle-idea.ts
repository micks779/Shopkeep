// Vercel Serverless Function - Bundle Idea Generation
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
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const isBundle = items.length > 1;
    const promptItems = items.slice(0, 12).join(', ');
    
    const prompt = isBundle 
      ? `I have a convenience store. These items are expiring soon: ${promptItems}. Suggest a creative "Bundle Deal" name and a short 1-sentence marketing hook.`
      : `I have a convenience store. This item is expiring soon: ${promptItems}. Suggest a creative "Flash Sale" name and a short 1-sentence marketing hook.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            tagline: { type: "string" }
          },
          required: ["title", "tagline"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate bundle idea' });
  }
}

