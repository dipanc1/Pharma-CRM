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

export const LINE_ACTIONS = {
    STOCK: 'stock',
    CREATE: 'create',
    SKIP: 'skip'
};

const today = () => new Date().toISOString().split('T')[0];

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

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
            action: product ? LINE_ACTIONS.STOCK : null,
            updateMrp: !!product && (item.mrp || 0) > 0 && Number(product.mrp || 0) !== Number(item.mrp),
            updateRate: !!product && (item.rate || 0) > 0 && Number(product.price || 0) !== Number(item.rate),
            new_company_name: parsed.company_name || ''
        };
    });

    return {
        company_name: parsed.company_name || '',
        bill_date: isValidDate(parsed.bill_date) ? parsed.bill_date : today(),
        bill_total: parsed.bill_total || 0,
        lines
    };
}

function normaliseCompany(name, companies) {
    const trimmed = (name || '').trim();
    if (!trimmed) return '';

    const exact = (companies || []).find(c => c.name === trimmed);
    if (exact) return exact.name;

    const lower = trimmed.toLowerCase();
    const caseInsensitive = (companies || []).find(c => (c.name || '').toLowerCase() === lower);
    return caseInsensitive ? caseInsensitive.name : trimmed;
}

export default function useBillScan({ products = [], companies = [], onSaved } = {}) {
    const [state, setState] = useState(BILL_STATES.IDLE);
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(null);
    const [saveResult, setSaveResult] = useState(null);

    const reset = useCallback(() => {
        setState(BILL_STATES.IDLE);
        setDraft(null);
        setError(null);
        setSaveResult(null);
    }, []);

    const scanBill = useCallback(async (file) => {
        if (!file) return;

        setState(BILL_STATES.PROCESSING);
        setError(null);
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
        setState(BILL_STATES.CONFIRMING);
    }, [products]);

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
        const billDate = isValidDate(draft.bill_date) ? draft.bill_date : today();

        const toSave = draft.lines.filter(
            line => line.action !== LINE_ACTIONS.SKIP && line.action !== null && line.quantity > 0
        );

        const failures = [];
        let savedCount = 0;

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

                await addStockTransaction({
                    product_id: productId,
                    transaction_type: TRANSACTION_TYPES.PURCHASE,
                    quantity: Math.round(Number(line.quantity)),
                    transaction_date: billDate,
                    notes: `Purchase from ${company || 'supplier'}`
                });

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

        if (savedCount > 0 && total > 0) {
            const { error: cashError } = await supabase.from('cash_flow').insert([{
                transaction_date: billDate,
                cash_type: 'out_flow',
                type: 'sundry',
                name: company || 'Supplier',
                purpose: 'purchase',
                amount: total,
                notes: `Bill import - ${savedCount} item${savedCount === 1 ? '' : 's'}`
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
    }, [draft, companies, onSaved]);

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
