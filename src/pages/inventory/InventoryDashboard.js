import React from 'react';
import { format } from 'date-fns';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    FilterSelect,
    Table,
    StatusBadge
} from '../../components';
import {
    CubeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ScaleIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

function InventoryDashboard({
    loading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    productFilter,
    setProductFilter,
    companyFilter,
    setCompanyFilter,
    companyOptions,
    products,
    inventoryData,
    stockMovementData,
    categoryStockData,
    lowStockProducts,
    summaryStats,
    onExportData,
    onRefresh
}) {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

    const tableHeaders = [
        'Product',
        'Company Name',
        'Opening Stock',
        'Purchases',
        'Sales',
        'Adjustments',
        'Closing Stock',
        'Stock Value',
        'Status'
    ];

    const productOptions = [
        ...(products || []).map(product => ({
            value: product.id,
            label: product.name
        }))
    ];

    const hasFilters = startDate || endDate || productFilter || companyFilter;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getStockStatusColor = (stock) => {
        if (stock <= 10) return 'text-red-600 bg-red-50';
        if (stock <= 25) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const safeStats = summaryStats || {
        totalProducts: 0,
        totalPurchases: 0,
        totalSales: 0,
        totalStockValue: 0
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 bg-gray-200 rounded"></div>
                        <div className="h-80 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Custom Header for Inventory Dashboard */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={onExportData}
                        disabled={loading || (inventoryData || []).length === 0}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Export Data
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ChartBarIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Date Range and Filters */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Filters & Date Range</h3>
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setProductFilter('');
                                setCompanyFilter('');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            className="input-field"
                            value={startDate || ''}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="end_date"
                            className="input-field"
                            value={endDate || ''}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || ''}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <FilterSelect
                            label="Filter by Product"
                            value={productFilter || ''}
                            onChange={(e) => setProductFilter(e.target.value)}
                            options={productOptions}
                            placeholder="All Products"
                            id="productFilter"
                        />
                    </div>
                    <div>
                        <FilterSelect
                            label="Filter by Company"
                            value={companyFilter || ''}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            options={companyOptions}
                            placeholder="All Companies"
                            id="companyFilter"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                            <CubeIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900">{safeStats.totalProducts.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Active inventory items</p>
                        </div>
                    </div>
                </div>

                <div className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                            <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900">{safeStats.totalPurchases.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Units purchased</p>
                        </div>
                    </div>
                </div>

                <div className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-900">{safeStats.totalSales.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Units sold</p>
                        </div>
                    </div>
                </div>

                <div className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                            <ScaleIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Stock Value</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeStats.totalStockValue)}</p>
                            <p className="text-xs text-gray-400 mt-1">Current inventory worth</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Stock Movement Over Time</h3>
                        <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">Purchases</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">Sales</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        {(stockMovementData || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stockMovementData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickLine={{ stroke: '#e0e0e0' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickLine={{ stroke: '#e0e0e0' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="purchases"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        name="Purchases"
                                        dot={{ fill: '#10B981', strokeWidth: 2 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        name="Sales"
                                        dot={{ fill: '#EF4444', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>No stock movement data available</p>
                                    <p className="text-sm text-gray-400">Data will appear when transactions are recorded</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stock by Category */}
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Value by Company</h3>
                    <div className="h-64">
                        {(categoryStockData || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryStockData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ company, percent }) => percent > 5 ? `${company} ${(percent * 100).toFixed(0)}%` : ''}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryStockData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [formatCurrency(value), 'Stock Value']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>No company data available</p>
                                    <p className="text-sm text-gray-400">Add products with companies to see distribution</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {(lowStockProducts || []).length > 0 && (
                <div className="card border-l-4 border-red-500">
                    <div className="flex items-center mb-4">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                        <h3 className="text-lg font-medium text-red-800">Low Stock Alert</h3>
                        <span className="ml-auto bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {lowStockProducts.length} items
                        </span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-700 mb-3">The following products are running low on stock (≤ 10 units):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {lowStockProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-3"
                                >
                                    <div>
                                        <p className="font-medium text-red-900">{product.name}</p>
                                        <p className="text-sm text-red-600">{product.current_stock} units left</p>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Critical
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Inventory Table */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Inventory Details
                            {hasFilters && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({startDate && endDate ? `${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')}` : 'Filtered'})
                                </span>
                            )}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                            Showing {(inventoryData || []).length} of {(products || []).length} products
                        </div>
                    </div>
                </div>

                {(inventoryData || []).length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table headers={tableHeaders}>
                            {(inventoryData || []).map((item) => (
                                <Table.Row key={item.product_id} className="hover:bg-gray-50">
                                    <Table.Cell className="font-medium">
                                        <div className="font-medium text-gray-900">{item.product_name}</div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {item.company_name || 'N/A'}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className="font-medium">{item.opening_stock.toLocaleString()}</span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className="text-green-600 font-medium">+{item.purchases.toLocaleString()}</span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className="text-red-600 font-medium">-{item.sales.toLocaleString()}</span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className={`font-medium ${item.adjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.adjustments >= 0 ? '+' : ''}{item.adjustments.toLocaleString()}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-center">
                                        <span className={`font-bold px-2 py-1 rounded ${getStockStatusColor(item.closing_stock)}`}>
                                            {item.closing_stock.toLocaleString()}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="font-medium">
                                        {formatCurrency(item.stock_value)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <StatusBadge
                                            status={item.closing_stock <= 10 ? 'low' : item.closing_stock > 50 ? 'high' : 'normal'}
                                            label={item.closing_stock <= 10 ? 'Low Stock' : item.closing_stock > 50 ? 'Good Stock' : 'Normal'}
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CubeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <div className="text-gray-500">
                            <h4 className="text-lg font-medium mb-2">
                                {hasFilters ? 'No inventory data found' : 'No inventory data available'}
                            </h4>
                            <p className="text-sm">
                                {hasFilters
                                    ? 'Try adjusting your filters or date range.'
                                    : 'Start by adding products and recording transactions.'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InventoryDashboard;