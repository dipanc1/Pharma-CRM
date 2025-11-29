import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useToast from '../../hooks/useToast';
import InventoryDashboard from './InventoryDashboard';
import { Toast } from '../../components';
import { format, startOfMonth } from 'date-fns';

function InventoryDashboardContainer() {
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [productFilter, setProductFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [inventoryData, setInventoryData] = useState([]);
    const [stockMovementData, setStockMovementData] = useState([]);
    const [categoryStockData, setCategoryStockData] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        totalProducts: 0,
        totalPurchases: 0,
        totalSales: 0,
        totalStockValue: 0
    });

    const { toast, showError, showSuccess, hideToast } = useToast();

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            fetchInventoryData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, startDate, endDate, productFilter, companyFilter]);

    const fetchProducts = async () => {
        try {
            const { data } = await supabase
                .from('products')
                .select('*')
                .order('name');

            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            showError('Failed to load products. Please try again.');
        }
    };

    const getTransactionsInRange = async (productIds, startDate, endDate) => {
        try {
            // Fetch all transactions for multiple products at once
            const { data, error } = await supabase
                .from('stock_transactions')
                .select('*')
                .in('product_id', productIds)
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)
                .order('transaction_date');

            if (error) {
                console.error('Error fetching transactions:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    };

    const calculateStockSummaryBatch = async (productIds, date) => {
        try {
            // Get all transactions for these products up to the date
            const { data, error } = await supabase
                .from('stock_transactions')
                .select('product_id, quantity')
                .in('product_id', productIds)
                .lte('transaction_date', date)
                .order('transaction_date');

            if (error) {
                console.error('Error calculating stock summary batch:', error);
                return {};
            }

            // Group transactions by product and sum quantities
            const stockSummaries = {};
            productIds.forEach(id => {
                stockSummaries[id] = { closingStock: 0 };
            });

            (data || []).forEach(transaction => {
                const productId = transaction.product_id;
                if (stockSummaries[productId]) {
                    stockSummaries[productId].closingStock += transaction.quantity;
                }
            });

            return stockSummaries;
        } catch (error) {
            console.error('Error calculating stock summary batch:', error);
            return {};
        }
    };

    const processProductsBatch = async (productsBatch, startDateToUse, endDateToUse) => {
        try {
            const productIds = productsBatch.map(p => p.id);

            // Get opening stock for all products (day before start date)
            const dayBeforeStart = new Date(startDateToUse);
            dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
            const openingStockSummaries = await calculateStockSummaryBatch(
                productIds, 
                dayBeforeStart.toISOString().split('T')[0]
            );

            // Get closing stock for all products (end date)
            const closingStockSummaries = await calculateStockSummaryBatch(productIds, endDateToUse);

            // Get transactions in the date range for all products
            const transactions = await getTransactionsInRange(productIds, startDateToUse, endDateToUse);

            // Group transactions by product
            const transactionsByProduct = {};
            productIds.forEach(id => {
                transactionsByProduct[id] = [];
            });

            transactions.forEach(transaction => {
                const productId = transaction.product_id;
                if (transactionsByProduct[productId]) {
                    transactionsByProduct[productId].push(transaction);
                }
            });

            // Process each product with its transactions
            return productsBatch.map(product => {
                try {
                    const productTransactions = transactionsByProduct[product.id] || [];
                    const openingStock = openingStockSummaries[product.id]?.closingStock || 0;
                    const closingStock = closingStockSummaries[product.id]?.closingStock || 0;

                    // Calculate purchases, sales, and adjustments
                    const purchases = productTransactions
                        .filter(t => t.transaction_type === 'purchase')
                        .reduce((sum, t) => sum + t.quantity, 0);

                    const sales = productTransactions
                        .filter(t => t.transaction_type === 'sale')
                        .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

                    const adjustments = productTransactions.reduce((sum, t) => {
                        if (t.transaction_type === 'adjustment') return sum + t.quantity;
                        if (t.transaction_type === 'sale_reversal') return sum + Math.abs(t.quantity);
                        return sum;
                    }, 0);

                    const stockValue = closingStock * (product.price || 0);

                    return {
                        product_id: product.id,
                        product_name: product.name,
                        company_name: product.company_name,
                        opening_stock: openingStock,
                        purchases,
                        sales,
                        adjustments,
                        closing_stock: closingStock,
                        stock_value: stockValue,
                        price: product.price || 0
                    };
                } catch (error) {
                    console.error(`Error processing product ${product.name}:`, error);
                    return {
                        product_id: product.id,
                        product_name: product.name,
                        company_name: product.company_name,
                        opening_stock: 0,
                        purchases: 0,
                        sales: 0,
                        adjustments: 0,
                        closing_stock: product.current_stock || 0,
                        stock_value: (product.current_stock || 0) * (product.price || 0),
                        price: product.price || 0
                    };
                }
            });
        } catch (error) {
            console.error('Error processing products batch:', error);
            return productsBatch.map(product => ({
                product_id: product.id,
                product_name: product.name,
                company_name: product.company_name,
                opening_stock: 0,
                purchases: 0,
                sales: 0,
                adjustments: 0,
                closing_stock: product.current_stock || 0,
                stock_value: (product.current_stock || 0) * (product.price || 0),
                price: product.price || 0
            }));
        }
    };

    const fetchInventoryData = async () => {
        try {
            setLoading(true);

            // Use current date if no dates provided
            const endDateToUse = endDate || new Date().toISOString().split('T')[0];
            const startDateToUse = startDate || '2020-01-01';

            let productsToProcess = products;
            if (productFilter) {
                productsToProcess = products.filter(p => p.id === productFilter);
            }
            if (companyFilter) {
                productsToProcess = productsToProcess.filter(p => p.company_name === companyFilter);
            }

            // If no products to process, return early
            if (productsToProcess.length === 0) {
                setInventoryData([]);
                setSummaryStats({
                    totalProducts: 0,
                    totalPurchases: 0,
                    totalSales: 0,
                    totalStockValue: 0
                });
                setCategoryStockData([]);
                setStockMovementData([]);
                return;
            }

            // Process products in smaller batches for better performance
            const BATCH_SIZE = 5; // Reduced batch size
            const inventoryResults = [];

            // Show progress for large datasets
            const totalBatches = Math.ceil(productsToProcess.length / BATCH_SIZE);
            let completedBatches = 0;

            for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
                const batch = productsToProcess.slice(i, i + BATCH_SIZE);
                
                try {
                    const batchResults = await processProductsBatch(batch, startDateToUse, endDateToUse);
                    inventoryResults.push(...batchResults);
                    
                    completedBatches++;
                    
                    // Update progress if it's a large dataset
                    if (totalBatches > 5) {
                        console.log(`Processing inventory: ${completedBatches}/${totalBatches} batches complete`);
                    }
                } catch (error) {
                    console.error(`Error processing batch ${i}:`, error);
                    // Continue with fallback data for this batch
                    const fallbackResults = batch.map(product => ({
                        product_id: product.id,
                        product_name: product.name,
                        company_name: product.company_name,
                        opening_stock: 0,
                        purchases: 0,
                        sales: 0,
                        adjustments: 0,
                        closing_stock: product.current_stock || 0,
                        stock_value: (product.current_stock || 0) * (product.price || 0),
                        price: product.price || 0
                    }));
                    inventoryResults.push(...fallbackResults);
                }

                // Add a small delay between batches to prevent overwhelming the database
                if (i + BATCH_SIZE < productsToProcess.length) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            setInventoryData(inventoryResults);

            // Calculate summary stats
            const stats = inventoryResults.reduce((acc, item) => ({
                totalProducts: acc.totalProducts + 1,
                totalPurchases: acc.totalPurchases + (item.purchases || 0),
                totalSales: acc.totalSales + (item.sales || 0),
                totalStockValue: acc.totalStockValue + (item.stock_value || 0)
            }), {
                totalProducts: 0,
                totalPurchases: 0,
                totalSales: 0,
                totalStockValue: 0
            });

            setSummaryStats(stats);

            // Generate other data in parallel
            await Promise.all([
                generateStockMovementData(startDateToUse, endDateToUse),
                generateCategoryStockData(inventoryResults)
            ]);

            // Find low stock products (use current stock, not calculated)
            const lowStock = products.filter(p => (p.current_stock || 0) <= 10);
            setLowStockProducts(lowStock);

        } catch (error) {
            console.error('Error fetching inventory data:', error);
            showError('Failed to load inventory data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateStockMovementData = async (startDate, endDate) => {
        try {
            // Optimize: only get necessary fields and use date grouping in query
            const { data, error } = await supabase
                .from('stock_transactions')
                .select('transaction_date, transaction_type, quantity')
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)
                .order('transaction_date');

            if (error) {
                console.error('Error generating stock movement data:', error);
                setStockMovementData([]);
                return;
            }

            // Group by date more efficiently
            const dailyData = new Map();
            
            (data || []).forEach(transaction => {
                const date = transaction.transaction_date;
                
                if (!dailyData.has(date)) {
                    dailyData.set(date, { purchases: 0, sales: 0, adjustments: 0 });
                }

                const dayData = dailyData.get(date);
                
                if (transaction.transaction_type === 'purchase') {
                    dayData.purchases += transaction.quantity;
                } else if (transaction.transaction_type === 'sale') {
                    dayData.sales += Math.abs(transaction.quantity);
                } else if (transaction.transaction_type === 'adjustment') {
                    dayData.adjustments += transaction.quantity;
                } else if (transaction.transaction_type === 'sale_reversal') {
                    dayData.adjustments += Math.abs(transaction.quantity);
                }
            });

            const chartData = Array.from(dailyData.entries())
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([date, data]) => ({
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    purchases: data.purchases,
                    sales: data.sales,
                    adjustments: data.adjustments
                }));

            setStockMovementData(chartData);
        } catch (error) {
            console.error('Error generating stock movement data:', error);
            setStockMovementData([]);
        }
    };

    const generateCategoryStockData = (inventoryData) => {
        try {
            const companyTotals = new Map();

            (inventoryData || []).forEach(item => {
                const company = item.company_name || 'Other';
                const currentValue = companyTotals.get(company) || 0;
                companyTotals.set(company, currentValue + (item.stock_value || 0));
            });

            const chartData = Array.from(companyTotals.entries())
                .map(([company, value]) => ({
                    company,
                    value: parseFloat(value) || 0
                }))
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value);

            setCategoryStockData(chartData);
        } catch (error) {
            console.error('Error generating category stock data:', error);
            setCategoryStockData([]);
        }
    };

    const handleExportData = () => {
        try {
            const csvData = [
                ['Product Name', 'Company Name', 'Opening Stock', 'Purchases', 'Sales', 'Adjustments', 'Closing Stock', 'Stock Value', 'Price'],
                ...(inventoryData || []).map(item => [
                    item.product_name,
                    item.company_name || 'N/A',
                    item.opening_stock,
                    item.purchases,
                    item.sales,
                    item.adjustments,
                    item.closing_stock,
                    item.stock_value.toFixed(2),
                    item.price.toFixed(2)
                ])
            ];

            const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            showSuccess('Inventory data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            showError('Failed to export data. Please try again.');
        }
    };

    const companyOptions = [...new Set(products.map(p => p.company_name).filter(Boolean))]
        .sort()
        .map(company => ({ value: company, label: company }));

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSearchChange = (value) => {
        setProductSearch(value);
        if (value.trim()) {
            setShowProductDropdown(true);
        } else {
            setProductFilter('');
            setShowProductDropdown(false);
        }
    };

    const handleProductSelect = (product) => {
        setProductFilter(product.id);
        setProductSearch(product.name);
        setShowProductDropdown(false);
    };

    return (
        <>
            <InventoryDashboard
                loading={loading}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                productFilter={productFilter}
                setProductFilter={setProductFilter}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                companyOptions={companyOptions}
                products={products}
                productSearch={productSearch}
                setProductSearch={handleProductSearchChange}
                showProductDropdown={showProductDropdown}
                setShowProductDropdown={setShowProductDropdown}
                filteredProducts={filteredProducts}
                handleProductSelect={handleProductSelect}
                inventoryData={inventoryData}
                stockMovementData={stockMovementData}
                categoryStockData={categoryStockData}
                lowStockProducts={lowStockProducts}
                summaryStats={summaryStats}
                onExportData={handleExportData}
            />
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </>
    );
}

export default InventoryDashboardContainer;