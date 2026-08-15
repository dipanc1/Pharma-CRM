import { ai, GEMINI_MODEL } from './gemini';

// Long edge cap for the uploaded photo. Phone cameras produce 4000px+ images;
// bill text stays legible well below that and the upload is far quicker.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Downscale an image File to a base64 JPEG payload for Gemini.
 * Returns { data, mimeType } — `data` is bare base64 with no `data:` prefix.
 */
export function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.onload = () => {
            const img = new Image();

            img.onerror = () => reject(new Error('That file does not look like a readable image.'));
            img.onload = () => {
                try {
                    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                    resolve({
                        data: dataUrl.split(',')[1],
                        mimeType: 'image/jpeg'
                    });
                } catch (error) {
                    reject(error);
                }
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

// Gemini enforces this shape, so the response needs no fence-stripping or repair.
// This is standard JSON Schema (lowercase types), which is what
// response_format.schema takes — not the older uppercase OpenAPI Type enum.
// matched_product_id is a plain string (empty when unmatched) rather than a
// nullable field — one less thing for the model to get subtly wrong.
const BILL_SCHEMA = {
    type: 'object',
    properties: {
        company_name: { type: 'string' },
        bill_date: { type: 'string' },
        bill_total: { type: 'number' },
        line_items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    matched_product_id: { type: 'string' },
                    item_name: { type: 'string' },
                    quantity: { type: 'number' },
                    mrp: { type: 'number' },
                    rate: { type: 'number' },
                    amount: { type: 'number' }
                },
                required: ['matched_product_id', 'item_name', 'quantity', 'mrp', 'rate', 'amount']
            }
        }
    },
    required: ['company_name', 'bill_date', 'bill_total', 'line_items']
};

function buildBillPrompt(products) {
    const today = new Date().toISOString().split('T')[0];

    let prompt = `You are reading a pharmaceutical purchase bill (invoice) photographed by a medical distributor.
Extract the bill into structured data.

BILL-LEVEL FIELDS:
- company_name: the SELLER / supplier / manufacturer the bill is FROM (not the buyer, not "DS Medical Agencies").
- bill_date: the invoice date in YYYY-MM-DD format. Indian bills are usually DD/MM/YYYY — read them that way. Today is ${today}. If no date is legible, use "".
- bill_total: the final payable amount (grand total after tax and round-off). A number only, no currency symbol.

LINE ITEMS — one entry per product row:
- item_name: the product name as printed on the bill.
- quantity: TOTAL SELLABLE UNITS, not the number of packs. If the bill shows 10 strips of 10 tablets, quantity is 100. If it shows "5 x 15", quantity is 75. If a free/scheme quantity is printed separately, ADD it to the quantity.
- mrp: the printed retail price per unit (MRP). 0 if not shown.
- rate: OUR purchase price per unit — the seller's rate to us, before tax. This is the "Rate" or "Price" column, NOT the MRP. 0 if not shown.
- amount: the line total as printed. 0 if not shown.

IGNORE non-product rows entirely: GST/CGST/SGST/IGST lines, discount lines, freight, packing, round-off, subtotals and grand totals. They are not line items.

If a value is illegible, use 0 for numbers and "" for strings rather than guessing.

PRODUCT MATCHING:
Match each line to an existing product ONLY when you are confident it is the same product.
- Put the exact ID from the list below into matched_product_id.
- If there is no confident match, set matched_product_id to "" (empty string).
- NEVER invent an ID. NEVER return an ID that is not in the list.
- Be strict: similar names are often DIFFERENT products. "Zerodol SP" and "Zerodol MR" differ by one word but are separate products — that is a non-match, not a match.
- An empty string costs the user one dropdown selection. A wrong ID silently corrupts their stock. Always prefer "" when uncertain.
`;

    if (products?.length) {
        prompt += `\nEXISTING PRODUCTS — only these IDs are valid:\n`;
        prompt += products
            .map(p => `- ID: "${p.id}", Name: "${p.name}", Company: "${p.company_name || 'N/A'}"`)
            .join('\n');
    } else {
        prompt += `\nThere are no existing products. Set matched_product_id to "" for every line.`;
    }

    return prompt;
}

/**
 * Send a bill image to Gemini and get back structured bill data.
 *
 * @param {File} file - the image chosen from camera or gallery
 * @param {Array} products - existing products, used for matching
 * @returns {{success: boolean, data?: object, error?: string}}
 */
export async function parseBillImage(file, products = []) {
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
        return {
            success: false,
            error: 'Bill scanning is not configured. Add REACT_APP_GEMINI_API_KEY to your environment.'
        };
    }

    try {
        const image = await compressImage(file);

        const interaction = await ai.interactions.create({
            model: GEMINI_MODEL,
            input: [
                { type: 'text', text: buildBillPrompt(products) },
                { type: 'image', data: image.data, mime_type: image.mimeType }
            ],
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: BILL_SCHEMA
            },
            generation_config: {
                max_output_tokens: 8192
            }
        });

        const parsed = JSON.parse(interaction.output_text);

        // Guard against a hallucinated ID slipping through the schema.
        const validIds = new Set((products || []).map(p => p.id));
        const lineItems = (parsed.line_items || []).map(item => ({
            item_name: item.item_name || '',
            quantity: Number(item.quantity) || 0,
            mrp: Number(item.mrp) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            matched_product_id: validIds.has(item.matched_product_id) ? item.matched_product_id : null
        }));

        return {
            success: true,
            data: {
                company_name: parsed.company_name || '',
                bill_date: parsed.bill_date || '',
                bill_total: Number(parsed.bill_total) || 0,
                line_items: lineItems
            }
        };
    } catch (error) {
        console.error('Bill parsing error:', error);
        return {
            success: false,
            error: 'Could not read that bill. Try a clearer, well-lit photo of the full page.'
        };
    }
}

export default parseBillImage;
