import { supabase } from '../lib/supabase';

export const TRANSACTION_TYPES = {
    OPENING: 'opening',
    PURCHASE: 'purchase',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment',
    SALE_REVERSAL: 'sale_reversal'
};

// Get stock transactions for a product up to a specific date
export const getStockTransactions = async (productId, upToDate) => {
    try {
        const { data, error } = await supabase
            .from('stock_transactions')
            .select('*')
            .eq('product_id', productId)
            .lte('transaction_date', upToDate)
            .order('transaction_date', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching stock transactions:', error);
        return [];
    }
};

export const handleAddStock = async (productId, quantity, notes) => {
    try {
        // Add stock transaction
        await addStockTransaction({
            product_id: productId,
            transaction_type: TRANSACTION_TYPES.PURCHASE, // or ADJUSTMENT
            quantity: parseInt(quantity),
            transaction_date: new Date().toISOString().split('T')[0],
            reference_type: 'manual_adjustment',
            notes: notes || 'Manual stock addition'
        });

        // Update current stock in products table
        await updateProductStock(productId);

        return true;
    } catch (error) {
        console.error('Error adding stock:', error);
    }
};


export const handleEditStock = async (productId, newQuantity, notes) => {
    try {
        // Get current stock
        const currentStock = await getCurrentStock(productId);
        const difference = newQuantity - currentStock;
        
        if (difference !== 0) {
            // Add stock transaction for the difference
            await addStockTransaction({
                product_id: productId,
                transaction_type: TRANSACTION_TYPES.ADJUSTMENT,
                quantity: difference, // Positive for increase, negative for decrease
                transaction_date: new Date().toISOString().split('T')[0],
                reference_type: 'manual_adjustment',
                notes: notes || `Stock adjusted from ${currentStock} to ${newQuantity} (${difference > 0 ? '+' : ''}${difference})`
            });

            // Update current stock in products table
            await updateProductStock(productId);
        }

        return true;
    } catch (error) {
        console.error('Error editing stock:', error);
        return false;
    }
};

// Calculate stock summary for a product on a specific date
export const calculateStockSummary = async (productId, date) => {
    const transactions = await getStockTransactions(productId, date);

    let openingStock = 0;
    let purchases = 0;
    let sales = 0;

    transactions.forEach(transaction => {
        switch (transaction.transaction_type) {
            case TRANSACTION_TYPES.OPENING:
            case TRANSACTION_TYPES.ADJUSTMENT:
                if (transaction.quantity > 0) {
                    openingStock += transaction.quantity;
                } else {
                    sales += Math.abs(transaction.quantity);
                }
                break;
            case TRANSACTION_TYPES.PURCHASE:
                purchases += transaction.quantity;
                break;
            case TRANSACTION_TYPES.SALE:
                sales += Math.abs(transaction.quantity);
                break;
            case TRANSACTION_TYPES.SALE_REVERSAL:
                sales -= Math.abs(transaction.quantity);
                break;
            default:
                break;
        }
    });

    sales = Math.max(0, sales);

    const closingStock = openingStock + purchases - sales;

    return {
        openingStock,
        purchases,
        sales,
        closingStock: Math.max(0, closingStock)
    };
};

// Add stock transaction
export const addStockTransaction = async (transaction) => {
    try {
        const { data } = await supabase
            .from('stock_transactions')
            .insert([transaction])
            .select()
            .single();

        return data;
    } catch (error) {
        console.error('Error adding stock transaction:', error);
    }
};

// Update current stock in products table
export const updateProductStock = async (productId) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const stockSummary = await calculateStockSummary(productId, today);

        const { data } = await supabase
            .from('products')
            .update({ current_stock: stockSummary.closingStock })
            .eq('id', productId);

        console.log('Product stock updated:', data);
        return stockSummary.closingStock;
    } catch (error) {
        console.error('Error updating product stock:', error);
    }
};

// Get current stock for a product
export const getCurrentStock = async (productId) => {
    try {
        const { data } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', productId)
            .single();

        return data?.current_stock || 0;
    } catch (error) {
        console.error('Error getting current stock:', error);
        return 0;
    }
};
