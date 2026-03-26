import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

/**
 * Parse natural language voice input into structured form data
 * using page-specific context and field definitions.
 * 
 * @param {string} transcript - The voice transcription text
 * @param {object} pageContext - Page-specific context with fields and instructions
 * @param {object} existingData - Current data in the system (doctors, products, etc.)
 * @returns {object} Parsed form data
 */
export async function parseVoiceInput(transcript, pageContext, existingData = {}) {
  const systemPrompt = buildSystemPrompt(pageContext, existingData);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${systemPrompt}\n\nUser said: "${transcript}"\n\nExtract the structured data as JSON. Only return valid JSON, no markdown formatting or code blocks.`,
      config: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    const text = response.text;
    
    // Clean the response - remove any markdown code blocks if present
    const cleanedResponse = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return { 
      success: false, 
      error: 'Failed to understand the voice command. Please try again or enter manually.' 
    };
  }
}

function buildSystemPrompt(pageContext, existingData) {
  let prompt = `You are a data extraction assistant for the DS Medical Agencies CRM application.
Your job is to extract structured form data from natural language voice input.

CONTEXT: ${pageContext.description}

FIELDS TO EXTRACT:
${pageContext.fields.map(f => `- ${f.name} (${f.type}): ${f.description}${f.required ? ' [REQUIRED]' : ''}${f.options ? ` Options: ${JSON.stringify(f.options)}` : ''}`).join('\n')}

RULES:
1. Return ONLY a valid JSON object with the field names as keys
2. For date fields, use YYYY-MM-DD format. Today's date is ${new Date().toISOString().split('T')[0]}
3. If a value is not mentioned, use null (not empty string)
4. For currency/price values, extract just the number (no currency symbols)
5. For enum/select fields, map to the closest valid option value
6. CRITICAL: For doctor/contact/product fields, you MUST return the exact ID from the AVAILABLE lists below. Do NOT invent or assume any ID.
7. If a spoken name does NOT clearly match any entry in the available list, return null for that field. NEVER guess or fabricate an ID.
8. Only match when you are confident the spoken name refers to an entry in the list (e.g. "Dr. Sharma" matches "Dr. R.K. Sharma", but "Dr. Random" matches nothing → return null).
`;

  if (existingData.doctors?.length) {
    prompt += `\nAVAILABLE CONTACTS (doctors/chemists) — ONLY use IDs from this list. If no match, return null:\n`;
    prompt += existingData.doctors.map(d => 
      `- ID: "${d.id}", Name: "${d.name}", Type: ${d.contact_type || 'doctor'}${d.specialization ? `, Specialization: ${d.specialization}` : ''}${d.hospital ? `, Hospital: ${d.hospital}` : ''}`
    ).join('\n');
  }

  if (existingData.products?.length) {
    prompt += `\nAVAILABLE PRODUCTS — ONLY use IDs from this list. If no match, return null:\n`;
    prompt += existingData.products.map(p => 
      `- ID: "${p.id}", Name: "${p.name}", Price: ₹${p.price}, Stock: ${p.current_stock || 0}`
    ).join('\n');
  }

  if (pageContext.additionalInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${pageContext.additionalInstructions}`;
  }

  return prompt;
}
