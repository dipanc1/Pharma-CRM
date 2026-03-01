/**
 * Page-specific voice command configurations.
 * Each config defines the context, fields, and labels for AI parsing.
 */

export const VOICE_CONTEXTS = {
  // ─── ADD DOCTOR ────────────────────────────────────────────
  addDoctor: {
    description: 'Adding a new doctor or chemist contact to the CRM',
    fields: [
      { name: 'name', type: 'string', description: 'Full name of the doctor or chemist/shop', required: true },
      { name: 'contact_type', type: 'enum', description: 'Type of contact', options: ['doctor', 'chemist'], required: true },
      { name: 'specialization', type: 'string', description: 'Medical specialization (only for doctors, not chemists). e.g. Cardiology, Neurology, General Physician' },
      { name: 'hospital', type: 'string', description: 'Hospital/clinic name for doctors, or shop location for chemists' },
      { name: 'contact_number', type: 'string', description: 'Phone/contact number' },
      { name: 'email', type: 'string', description: 'Email address' },
      { name: 'address', type: 'string', description: 'Full address' },
      { name: 'doctor_class', type: 'enum', description: 'Classification (only for doctors)', options: ['A', 'B', 'C'] },
      { name: 'doctor_type', type: 'enum', description: 'Whether doctor dispenses or prescribes (only for doctors)', options: ['dispenser', 'prescriber'] }
    ],
    additionalInstructions: `
- If the user says "chemist" or "pharmacy" or "medical store", set contact_type to "chemist" and set specialization, doctor_class, doctor_type to null
- If the user says "doctor" or "Dr." or mentions a specialization, set contact_type to "doctor"
- Default to "doctor" if unclear
- For doctor_class, "A class" means "A", "B class" means "B", etc.
- For doctor_type, "dispenser" means doctor who dispenses medicines directly, "prescriber" writes prescriptions
    `,
    fieldLabels: {
      name: 'Name',
      contact_type: 'Contact Type',
      specialization: 'Specialization',
      hospital: 'Hospital/Location',
      contact_number: 'Contact Number',
      email: 'Email',
      address: 'Address',
      doctor_class: 'Class',
      doctor_type: 'Doctor Type'
    },
    fieldOrder: ['name', 'contact_type', 'specialization', 'hospital', 'doctor_class', 'doctor_type', 'contact_number', 'email', 'address']
  },

  // ─── ADD PRODUCT ───────────────────────────────────────────
  addProduct: {
    description: 'Adding a new pharmaceutical product to the inventory',
    fields: [
      { name: 'name', type: 'string', description: 'Product/medicine name', required: true },
      { name: 'company_name', type: 'enum', description: 'Manufacturing company', options: ['LSB LIFE SCIENCES', 'FLOWRICH PHARMA', 'CRANIX PHARMA', 'BRVYMA'], required: true },
      { name: 'price', type: 'number', description: 'Price in INR (just the number)', required: true },
      { name: 'description', type: 'string', description: 'Product description' }
    ],
    additionalInstructions: `
- Match company name to the closest option (e.g. "LSB" → "LSB LIFE SCIENCES", "flowrich" → "FLOWRICH PHARMA", "cranix" → "CRANIX PHARMA")
- Price should be a number without currency symbol
- Common medicine name patterns: tablets, capsules, syrup, injection, cream, ointment
    `,
    fieldLabels: {
      name: 'Product Name',
      company_name: 'Company',
      price: 'Price (₹)',
      description: 'Description'
    },
    fieldOrder: ['name', 'company_name', 'price', 'description']
  },

  // ─── ADD VISIT ─────────────────────────────────────────────
  addVisit: {
    description: 'Recording a doctor/chemist visit with optional sales. This is complex: it involves selecting a contact, setting visit details, and optionally adding sale items (products sold during the visit).',
    fields: [
      { name: 'doctor_id', type: 'string', description: 'The exact ID (UUID) of the doctor/chemist from the AVAILABLE CONTACTS list. Must be an exact ID from the list. If no match found, return null.', required: true },
      { name: 'doctor_name_display', type: 'string', description: 'The matched doctor/chemist name for display purposes. Null if no match.' },
      { name: 'visit_date', type: 'date', description: 'Date of visit in YYYY-MM-DD format', required: true },
      { name: 'notes', type: 'string', description: 'Visit notes or comments' },
      { name: 'status', type: 'enum', description: 'Visit status', options: ['completed', 'scheduled', 'cancelled'] },
      { name: 'sales', type: 'array', description: 'Array of sale items. Each item: { product_id: string (exact UUID from AVAILABLE PRODUCTS), product_name_display: string, quantity: number, unit_price: number }. Only include items that match a product in the list. Skip any unmatched products.' }
    ],
    additionalInstructions: `
- For doctor_id: Look up the spoken doctor/chemist name in the AVAILABLE CONTACTS list. Return the EXACT ID from that list. If the name does not match any contact, set doctor_id to null.
- For sales product_id: Look up each product name in the AVAILABLE PRODUCTS list. Return the EXACT product ID. If a product is not found in the list, SKIP that sale item entirely — do not include it.
- Default status to "completed" if not specified
- Default visit_date to today if not specified
- "today" means today's date, "yesterday" means yesterday, etc.
- For sales items, extract quantity and price per unit
- If the user says "gave 10 [product] at 50 each", that means quantity=10, unit_price=50
- If unit_price is not mentioned, use the Price from the AVAILABLE PRODUCTS list
- If no sales are mentioned, set sales to an empty array []
- Common phrasings: "visited Dr. X", "went to see Dr. X", "at Dr. X's clinic"
- "sold", "gave", "dispensed", "supplied" all mean a sale happened
- NEVER invent or guess an ID. Only use IDs present in the available lists.
    `,
    fieldLabels: {
      doctor_id: 'Contact',
      doctor_name_display: 'Contact Name',
      visit_date: 'Visit Date',
      notes: 'Notes',
      status: 'Status',
      sales: 'Sale Items'
    },
    fieldOrder: ['doctor_name_display', 'visit_date', 'status', 'notes', 'sales']
  },

  // ─── CASH FLOW ─────────────────────────────────────────────
  addCashFlow: {
    description: 'Recording a cash flow transaction (money coming in or going out)',
    fields: [
      { name: 'transaction_date', type: 'date', description: 'Date of transaction in YYYY-MM-DD format', required: true },
      { name: 'cash_type', type: 'enum', description: 'Whether money came in or went out', options: ['in_flow', 'out_flow'], required: true },
      { name: 'name', type: 'string', description: 'Person name or description of the transaction', required: true },
      { name: 'type', type: 'enum', description: 'Category', options: ['sundry', 'person'], required: true },
      { name: 'amount', type: 'number', description: 'Amount in INR (just the number)', required: true },
      { name: 'purpose', type: 'enum', description: 'Purpose of the transaction', options: [] },
      { name: 'notes', type: 'string', description: 'Additional notes' },
      { name: 'doctor_id', type: 'string', description: 'The exact ID (UUID) of the linked doctor/chemist from the AVAILABLE CONTACTS list. If no match, return null.' },
      { name: 'doctor_name_display', type: 'string', description: 'Matched contact name for display. Null if no match.' }
    ],
    additionalInstructions: `
- "received", "got", "collected", "incoming" → cash_type: "in_flow"
- "paid", "spent", "gave", "expense", "outgoing" → cash_type: "out_flow"
- Default to "out_flow" if unclear
- For in_flow purposes: "advance", "loan", "other", "debt_received"
- For out_flow purposes: "advance", "loan", "purchase", "other", "expense", "gift", "payment", "daily_expense", "travel_expense"
- "person" type when it's about a specific person, "sundry" for general expenses
- For doctor_id: Look up the spoken name in the AVAILABLE CONTACTS list. Return the EXACT ID. If the name does not match any contact, set doctor_id to null.
- Default transaction_date to today if not specified
- "travel" or "travelling" → purpose: "travel_expense"
- "food", "tea", "lunch", "daily" → purpose: "daily_expense"
- NEVER invent or guess an ID. Only use IDs present in the available list.
    `,
    fieldLabels: {
      transaction_date: 'Date',
      cash_type: 'Flow Type',
      name: 'Name/Description',
      type: 'Category',
      amount: 'Amount (₹)',
      purpose: 'Purpose',
      notes: 'Notes',
      doctor_id: 'Linked Contact',
      doctor_name_display: 'Contact Name'
    },
    fieldOrder: ['transaction_date', 'cash_type', 'type', 'name', 'amount', 'purpose', 'doctor_name_display', 'notes']
  }
};

export default VOICE_CONTEXTS;
