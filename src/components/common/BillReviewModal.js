import React from 'react';
import {
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BILL_STATES, LINE_ACTIONS } from '../../hooks/useBillScan';

const money = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

function LineCard({ line, products, onLineChange, onAssignProduct }) {
    const isNew = !line.product;
    const resulting = line.product
        ? (Number(line.product.current_stock) || 0) + (Number(line.quantity) || 0)
        : null;

    const numberField = (label, field, step = '0.01') => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type="number"
                step={step}
                min="0"
                value={line[field]}
                onChange={(e) => onLineChange(line.key, { [field]: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
    );

    return (
        <div className={`border rounded-lg p-3 ${line.action === LINE_ACTIONS.SKIP
            ? 'border-gray-200 bg-gray-50 opacity-60'
            : line.action === null
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}>
            <div className="flex items-start justify-between gap-2 mb-3">
                <input
                    type="text"
                    value={line.item_name}
                    onChange={(e) => onLineChange(line.key, { item_name: e.target.value })}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product name"
                />
                <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${isNew ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {isNew ? 'New' : 'Matched'}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {numberField('Quantity', 'quantity', '1')}
                {numberField('MRP (₹)', 'mrp')}
                {numberField('Rate (₹)', 'rate')}
                {numberField('Amount (₹)', 'amount')}
            </div>

            {line.product ? (
                <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                        Matched to <span className="font-medium text-gray-900">{line.product.name}</span>
                        {' · '}Stock {line.product.current_stock || 0} → <span className="font-medium text-green-700">{resulting}</span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {Number(line.mrp) > 0 && Number(line.product.mrp || 0) !== Number(line.mrp) && (
                            <label className="flex items-center text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={line.updateMrp}
                                    onChange={(e) => onLineChange(line.key, { updateMrp: e.target.checked })}
                                    className="mr-1.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                                />
                                Update MRP {money(line.product.mrp)} → {money(line.mrp)}
                            </label>
                        )}
                        {Number(line.rate) > 0 && Number(line.product.price || 0) !== Number(line.rate) && (
                            <label className="flex items-center text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={line.updateRate}
                                    onChange={(e) => onLineChange(line.key, { updateRate: e.target.checked })}
                                    className="mr-1.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                                />
                                Update rate {money(line.product.price)} → {money(line.rate)}
                            </label>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onLineChange(line.key, {
                            action: line.action === LINE_ACTIONS.SKIP ? LINE_ACTIONS.STOCK : LINE_ACTIONS.SKIP
                        })}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                        {line.action === LINE_ACTIONS.SKIP ? 'Include this line' : 'Skip this line'}
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Or use an existing product instead
                        </label>
                        <select
                            value=""
                            onChange={(e) => e.target.value && onAssignProduct(line.key, e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select an existing product…</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}{p.company_name ? ` — ${p.company_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {line.action === LINE_ACTIONS.CREATE && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Company for new product</label>
                            <input
                                type="text"
                                value={line.new_company_name}
                                onChange={(e) => onLineChange(line.key, { new_company_name: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onLineChange(line.key, { action: LINE_ACTIONS.CREATE })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${line.action === LINE_ACTIONS.CREATE
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                }`}
                        >
                            Create product
                        </button>
                        <button
                            type="button"
                            onClick={() => onLineChange(line.key, { action: LINE_ACTIONS.SKIP })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${line.action === LINE_ACTIONS.SKIP
                                ? 'bg-gray-600 text-white border-gray-600'
                                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Skip
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const BillReviewModal = ({
    isOpen,
    state,
    draft,
    error,
    unresolvedCount,
    lineSum,
    isSaving,
    products = [],
    companies = [],
    onHeaderChange,
    onLineChange,
    onAssignProduct,
    onSave,
    onClose
}) => {
    if (!isOpen) return null;

    const includedLines = draft
        ? draft.lines.filter(line => line.action !== LINE_ACTIONS.SKIP && line.action !== null)
        : [];
    const newCount = includedLines.filter(line => line.action === LINE_ACTIONS.CREATE).length;
    const total = Number(draft?.bill_total) || 0;
    const mismatch = draft && Math.abs(total - lineSum) > 0.5;

    const headerField = (label, field, type = 'text', extra = {}) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                value={draft[field]}
                onChange={(e) => onHeaderChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                {...extra}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={isSaving ? undefined : onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-4xl">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 sm:px-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mr-3">
                                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Review Bill</h3>
                        </div>
                        <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                            Close
                        </button>
                    </div>

                    <div className="px-4 py-5 sm:px-6 max-h-[70vh] overflow-y-auto">
                        {state === BILL_STATES.PROCESSING && (
                            <div className="py-12 text-center">
                                <ArrowPathIcon className="h-10 w-10 mx-auto text-blue-600 animate-spin" />
                                <p className="mt-4 text-sm font-medium text-gray-900">Reading the bill…</p>
                                <p className="mt-1 text-xs text-gray-500">This usually takes a few seconds.</p>
                            </div>
                        )}

                        {state === BILL_STATES.ERROR && (
                            <div className="py-12 text-center">
                                <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
                                <p className="mt-4 text-sm font-medium text-gray-900">Could not read the bill</p>
                                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">{error}</p>
                                <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    Try Again
                                </button>
                            </div>
                        )}

                        {draft && (state === BILL_STATES.CONFIRMING || state === BILL_STATES.SAVING) && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                                        <input
                                            type="text"
                                            list="bill-companies"
                                            value={draft.company_name}
                                            onChange={(e) => onHeaderChange('company_name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <datalist id="bill-companies">
                                            {companies.map(c => <option key={c.id || c.name} value={c.name} />)}
                                        </datalist>
                                    </div>
                                    {headerField('Bill Date', 'bill_date', 'date')}
                                    {headerField('Total Paid (₹)', 'bill_total', 'number', { step: '0.01', min: '0' })}
                                </div>

                                {mismatch && (
                                    <p className="text-xs text-gray-500">
                                        Line items add up to {money(lineSum)} but the bill total is {money(total)}.
                                        That is normal when the bill includes GST, freight or a discount — {money(total)} is what gets recorded as paid.
                                    </p>
                                )}

                                {unresolvedCount > 0 && (
                                    <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                        <p className="text-xs text-yellow-800">
                                            {unresolvedCount} item{unresolvedCount === 1 ? '' : 's'} did not match an existing product.
                                            Choose Create, Skip, or pick an existing product for each before saving.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {draft.lines.map(line => (
                                        <LineCard
                                            key={line.key}
                                            line={line}
                                            products={products}
                                            onLineChange={onLineChange}
                                            onAssignProduct={onAssignProduct}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {draft && (state === BILL_STATES.CONFIRMING || state === BILL_STATES.SAVING) && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-gray-200 bg-gray-50 sm:px-6 rounded-b-lg">
                            <div className="text-xs text-gray-600">
                                <span className="font-medium text-gray-900">{includedLines.length}</span> item{includedLines.length === 1 ? '' : 's'} to import
                                {newCount > 0 && <> · <span className="font-medium text-gray-900">{newCount}</span> new product{newCount === 1 ? '' : 's'}</>}
                                {' · '}outflow <span className="font-medium text-gray-900">{money(total)}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={isSaving || unresolvedCount > 0 || includedLines.length === 0}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <><ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                                    ) : (
                                        <><CheckCircleIcon className="h-4 w-4 mr-2" /> Confirm &amp; Save</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillReviewModal;
