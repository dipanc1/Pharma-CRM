import { GoogleGenAI } from '@google/genai';

// Shared Gemini client. Consumers: src/lib/billParser.js
export const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

// Newest Gemini 3 Flash. Vision + structured JSON output, which is all the
// bill scanner needs.
export const GEMINI_MODEL = 'gemini-3.7-flash';

export default ai;
