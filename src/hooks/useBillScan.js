import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseBillImage } from '../lib/billParser';
import { addStockTransaction, TRANSACTION_TYPES } from '../utils/stockUtils';

export const BILL_STATES = {
    IDLE: 'idle',
    PROCESSING: 'processing',
    CONFIRMING: 'confirming',
    SAVING: 'saving',
    ERROR: 'error'
};

// What to do with a single bill line at save time.
export const LINE_ACTIONS = {
    STOCK: 'stock',   // add to an existing product
    CREATE: 'create', // create the product, then add stock
    SKIP: 'skip'      // ignore this line entirely
};

const today = () => new Date().toISOString().split('T')[0];

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

/**
 * Build the editable draft from what Gemini returned.
 * Matched lines are ready to go; unmatched lines start unresolved so the user
 * has to consciously choose create-or-skip before saving.
 */
function buildDraft(parsed, products) {
    const byId = new Map((products || []).map(p => [p.id, p]));

    const lines = (parsed.line_items || []).map((item, index) => {
        const product = item.matched_product_id ? byId.get(item.matched_product_id) : null;

        return {
            key: `line-${index}`,
            item_name: item.item_name || '',
            quantity: item.quantity || 0,
            mrp: item.mrp || 0,
            rate: item.rate || 0,
            amount: item.amount || 0,
            product_id: product ? product.id : null,
            product,
            // Unmatched lines are deliberately left null — the footer blocks saving
            // until every one of them is resolved.
            action: product ? LINE_ACTIONS.STOCK : null,
            // Only offer to overwrite a price when the bill actually disagrees
            // with what's on file. Blanket overwrites would clobber manual edits.
            updateMrp: !!product && (item.mrp || 0) > 0 && Number(product.mrp || 0) !== Number(item.mrp),
            updateRate: !!product && (item.rate || 0) > 0 && Number(product.price || 0) !== Number(item.rate),
            // Company for a to-be-created product; prefilled from the bill header.
            new_company_name: parsed.company_name || ''
        };
    });

    return {
        company_name: parsed.company_name || '',
        bill_number: parsed.bill_number || '',
        bill_date: isValidDate(parsed.bill_date) ? parsed.bill_date : today(),
        bill_total: parsed.bill_total || 0,
        lines
    };
}

/**
 * Normalise the typed company against the companies table so "Cipla" and
 * "cipla" don't end up as two separate vendors. Falls back to what was typed.
 */
function normaliseCompany(name, companies) {
    const trimmed = (name || '').trim();
    if (!trimmed) return '';

    const exact = (companies || []).find(c => c.name === trimmed);
    if (exact) return exact.name;

    const lower = trimmed.toLowerCase();
    const caseInsensitive = (companies || []).find(c => (c.name || '').toLowerCase() === lower);
    return caseInsensitive ? caseInsensitive.name : trimmed;
}

/**
 * Scan a purchase bill and turn it into stock, price updates and a cash outflow.
 *
 * @param {object} options
 * @param {Array}  options.products  - existing products, for matching
 * @param {Array}  options.companies - existing companies, for name normalisation
 * @param {Function} options.onSaved - called after a save that wrote something
 */
export default function useBillScan({ products = [], companies = [], onSaved } = {}) {
    const [state, setState] = useState(BILL_STATES.IDLE);
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(null);
    const [duplicateOf, setDuplicateOf] = useState(null);
    const [saveResult, setSaveResult] = useState(null);

    const reset = useCallback(() => {
        setState(BILL_STATES.IDLE);
        setDraft(null);
        setError(null);
        setDuplicateOf(null);
        setSaveResult(null);
    }, []);

    // Warn if this bill number was already imported, but don't block it —
    // suppliers do reuse numbers across years.
    const checkDuplicate = useCallback(async (billNumber) => {
        if (!billNumber?.trim()) return null;

        const { data, error: dupError } = await supabase
            .from('stock_transactions')
            .select('transaction_date')
            .eq('reference_number', billNumber.trim())
            .order('transaction_date', { ascending: false })
            .limit(1);

        if (dupError || !data?.length) return null;
        return data[0].transaction_date;
    }, []);

    const scanBill = useCallback(async (file) => {
        if (!file) return;

        setState(BILL_STATES.PROCESSING);
        setError(null);
        setDuplicateOf(null);
        setSaveResult(null);

        const result = await parseBillImage(file, products);

        if (!result.success) {
            setError(result.error);
            setState(BILL_STATES.ERROR);
            return;
        }

        if (!result.data.line_items.length) {
            setError('No product lines were found on that image. Make sure the whole bill is in frame.');
            setState(BILL_STATES.ERROR);
            return;
        }

        setDraft(buildDraft(result.data, products));
        setDuplicateOf(await checkDuplicate(result.data.bill_number));
        setState(BILL_STATES.CONFIRMING);
    }, [products, checkDuplicate]);

    const updateHeader = useCallback((field, value) => {
        setDraft(prev => (prev ? { ...prev, [field]: value } : prev));
    }, []);

    const updateLine = useCallback((key, changes) => {
        setDraft(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                lines: prev.lines.map(line => (line.key === key ? { ...line, ...changes } : line))
            };
        });
    }, []);

    // Map an unmatched line onto an existing product instead of creating a
    // near-duplicate — the common case when the OCR misreads a name.
    const assignProduct = useCallback((key, productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setDraft(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                lines: prev.lines.map(line => {
                    if (line.key !== key) return line;
                    return {
                        ...line,
                        product_id: product.id,
                        product,
                        action: LINE_ACTIONS.STOCK,
                        updateMrp: line.mrp > 0 && Number(product.mrp || 0) !== Number(line.mrp),
                        updateRate: line.rate > 0 && Number(product.price || 0) !== Number(line.rate)
                    };
                })
            };
        });
    }, [products]);

    const saveBill = useCallback(async () => {
        if (!draft) return;

        setState(BILL_STATES.SAVING);

        const company = normaliseCompany(draft.company_name, companies);
        const billNumber = draft.bill_number?.trim() || null;
        const billDate = isValidDate(draft.bill_date) ? draft.bill_date : today();
        const noteSuffix = billNumber ? ` (Bill ${billNumber})` : '';

        const toSave = draft.lines.filter(
            line => line.action !== LINE_ACTIONS.SKIP && line.action !== null && line.quantity > 0
        );

        const failures = [];
        let savedCount = 0;

        // No transaction or RPC is available, so this runs line by line and the
        // cash outflow goes in last. Money recorded then never exceeds stock
        // recorded, which is the safer way to fail.
        for (const line of toSave) {
            try {
                let productId = line.product_id;

                if (line.action === LINE_ACTIONS.CREATE) {
                    const { data: created, error: createError } = await supabase
                        .from('products')
                        .insert([{
                            name: line.item_name.trim(),
                            company_name: normaliseCompany(line.new_company_name || company, companies),
                            price: Number(line.rate) || 0,
                            mrp: Number(line.mrp) || 0
                        }])
                        .select('id')
                        .single();

                    if (createError) throw createError;
                    productId = created.id;
                }

                if (!productId) {
                    throw new Error('No product selected');
                }

                // The trigger_update_stock DB trigger recomputes current_stock on
                // insert, so there is deliberately no updateProductStock() call here.
                await addStockTransaction({
                    product_id: productId,
                    transaction_type: TRANSACTION_TYPES.PURCHASE,
                    quantity: Math.round(Number(line.quantity)),
                    transaction_date: billDate,
                    reference_number: billNumber,
                    notes: `Purchase from ${company || 'supplier'}${noteSuffix}`
                });

                // Price refresh is opt-in per line and only for existing products;
                // a newly created one already carries the bill's values.
                if (line.action === LINE_ACTIONS.STOCK) {
                    const priceUpdate = {};
                    if (line.updateMrp && Number(line.mrp) > 0) priceUpdate.mrp = Number(line.mrp);
                    if (line.updateRate && Number(line.rate) > 0) priceUpdate.price = Number(line.rate);

                    if (Object.keys(priceUpdate).length > 0) {
                        const { error: priceError } = await supabase
                            .from('products')
                            .update(priceUpdate)
                            .eq('id', productId);
                        if (priceError) throw priceError;
                    }
                }

                savedCount += 1;
            } catch (lineError) {
                console.error('Bill line failed:', line.item_name, lineError);
                failures.push(line.item_name || 'Unnamed item');
            }
        }

        let cashFlowSaved = false;
        const total = Number(draft.bill_total) || 0;

        // Only record the payment if at least one line actually landed.
        if (savedCount > 0 && total > 0) {
            const { error: cashError } = await supabase.from('cash_flow').insert([{
                transaction_date: billDate,
                cash_type: 'out_flow',
                type: 'sundry',
                name: company || 'Supplier',
                purpose: 'purchase',
                amount: total,
                notes: `Bill import${noteSuffix} - ${savedCount} item${savedCount === 1 ? '' : 's'}`
                // reference_type / reference_id are both left unset: the
                // chk_reference_consistency constraint needs them both-null or both-set.
            }]);

            if (cashError) {
                console.error('Cash flow entry failed:', cashError);
            } else {
                cashFlowSaved = true;
            }
        }

        setSaveResult({
            savedCount,
            totalCount: toSave.length,
            failures,
            cashFlowSaved,
            cashFlowExpected: savedCount > 0 && total > 0
        });

        if (savedCount > 0 && onSaved) {
            await onSaved();
        }

        setState(BILL_STATES.IDLE);
        setDraft(null);
        setDuplicateOf(null);
    }, [draft, companies, onSaved]);

    // Derived helpers for the modal
    const unresolvedCount = draft
        ? draft.lines.filter(line => line.action === null).length
        : 0;

    const lineSum = draft
        ? draft.lines
            .filter(line => line.action !== LINE_ACTIONS.SKIP)
            .reduce((sum, line) => sum + (Number(line.amount) || 0), 0)
        : 0;

    return {
        state,
        draft,
        error,
        duplicateOf,
        saveResult,
        unresolvedCount,
        lineSum,
        isOpen: state !== BILL_STATES.IDLE,
        isProcessing: state === BILL_STATES.PROCESSING,
        isSaving: state === BILL_STATES.SAVING,
        scanBill,
        updateHeader,
        updateLine,
        assignProduct,
        saveBill,
        reset,
        clearSaveResult: () => setSaveResult(null)
    };
}
