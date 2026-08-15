import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

export const GEMINI_MODEL = 'gemini-3.7-flash';

export default ai;
