import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useToast from '../../hooks/useToast';
import InventoryDashboard from './InventoryDashboard';
import { calculateStockSummary } from '../../utils/stockUtils';
import { Toast } from '../../components';

function InventoryDashboardContainer() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [products, setProducts] = useState([]);
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
    }, [products, startDate, endDate, productFilter]);

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

    const getTransactionsInRange = async (productId, startDate, endDate) => {
        try {
            const { data, error } = await supabase
                .from('stock_transactions')
                .select('*')
                .eq('product_id', productId)
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

    const processProductInventory = async (product, startDateToUse, endDateToUse) => {
        try {
            // Calculate opening stock (day before start date)
            const dayBeforeStart = new Date(startDateToUse);
            dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
            const openingStockSummary = await calculateStockSummary(
                product.id,
                dayBeforeStart.toISOString().split('T')[0]
            );

            // Calculate closing stock (end date)
            const closingStockSummary = await calculateStockSummary(product.id, endDateToUse);

            // Get transactions in the date range
            const transactions = await getTransactionsInRange(product.id, startDateToUse, endDateToUse);

            const purchases = transactions
                .filter(t => ['purchase', 'adjustment'].includes(t.transaction_type) && t.quantity > 0)
                .reduce((sum, t) => sum + t.quantity, 0);

            const sales = transactions
                .filter(t => ['sale'].includes(t.transaction_type))
                .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

            const adjustments = transactions
                .filter(t => t.transaction_type === 'adjustment')
                .reduce((sum, t) => sum + t.quantity, 0);

            const stockValue = closingStockSummary.closingStock * (product.price || 0);

            return {
                product_id: product.id,
                product_name: product.name,
                company_name: product.company_name,
                opening_stock: openingStockSummary.closingStock,
                purchases,
                sales,
                adjustments,
                closing_stock: closingStockSummary.closingStock,
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

            // Process products in batches for better performance
            const BATCH_SIZE = 10;
            const inventoryResults = [];

            for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
                const batch = productsToProcess.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(product =>
                    processProductInventory(product, startDateToUse, endDateToUse)
                );

                const batchResults = await Promise.all(batchPromises);
                inventoryResults.push(...batchResults);
            }

            setInventoryData(inventoryResults);

            // Calculate summary stats
            const stats = inventoryResults.reduce((acc, item) => ({
                totalProducts: acc.totalProducts + 1,
                totalPurchases: acc.totalPurchases + item.purchases,
                totalSales: acc.totalSales + item.sales,
                totalStockValue: acc.totalStockValue + item.stock_value
            }), {
                totalProducts: 0,
                totalPurchases: 0,
                totalSales: 0,
                totalStockValue: 0
            });

            setSummaryStats(stats);

            // Generate stock movement data for chart
            await generateStockMovementData(startDateToUse, endDateToUse);

            // Generate category stock data
            generateCategoryStockData(inventoryResults);

            // Find low stock products
            const lowStock = products.filter(p => (p.current_stock || 0) <= 10);
            setLowStockProducts(lowStock);

        } catch (error) {
            console.error('Error fetching inventory data:', error);
            showError('Failed to load inventory data. Please check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateStockMovementData = async (startDate, endDate) => {
        try {
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

            // Group by date
            const dailyData = {};
            (data || []).forEach(transaction => {
                const date = transaction.transaction_date;
                if (!dailyData[date]) {
                    dailyData[date] = { purchases: 0, sales: 0 };
                }

                if (['purchase', 'adjustment'].includes(transaction.transaction_type) && transaction.quantity > 0) {
                    dailyData[date].purchases += transaction.quantity;
                } else if (transaction.transaction_type === 'sale') {
                    dailyData[date].sales += Math.abs(transaction.quantity);
                }
            });

            const chartData = Object.entries(dailyData)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([date, data]) => ({
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    purchases: data.purchases,
                    sales: data.sales
                }));

            setStockMovementData(chartData);
        } catch (error) {
            console.error('Error generating stock movement data:', error);
            setStockMovementData([]);
        }
    };

    const generateCategoryStockData = (inventoryData) => {
        const companyTotals = (inventoryData || []).reduce((acc, item) => {
            const company = item.company_name || 'Other';
            acc[company] = (acc[company] || 0) + item.stock_value;
            return acc;
        }, {});

        const chartData = Object.entries(companyTotals)
            .map(([company, value]) => ({
                company,
                value: parseFloat(value)
            }))
            .sort((a, b) => b.value - a.value);

        setCategoryStockData(chartData);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchInventoryData();
        showSuccess('Inventory data refreshed successfully');
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

    return (
        <>
            <InventoryDashboard
                loading={loading || refreshing}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                productFilter={productFilter}
                setProductFilter={setProductFilter}
                products={products}
                inventoryData={inventoryData}
                stockMovementData={stockMovementData}
                categoryStockData={categoryStockData}
                lowStockProducts={lowStockProducts}
                summaryStats={summaryStats}
                onExportData={handleExportData}
                onRefresh={handleRefresh}
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