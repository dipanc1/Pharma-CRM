import React, { useState } from 'react';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Header, Loader } from '../../components';
import { format } from 'date-fns';
import { handleReload } from '../../helper';
import { getCycleLabel } from '../../utils/cycleUtils';

function CyclePlanning({
  selectedCycle,
  setSelectedCycle,
  selectedProductId,
  setSelectedProductId,
  cycleOptions,
  products,
  plansByProduct,
  visitAchievements,
  cycleMonthRanges,
  doctorSearch,
  setDoctorSearch,
  showDoctorDropdown,
  setShowDoctorDropdown,
  filteredDoctors,
  addDoctorToCycle,
  removeDoctorFromCycle,
  loading,
  submitting
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const getMonthStatus = (dates, monthRange) => {
    if (monthRange.start > today) return 'upcoming';
    return dates.length >= 3 ? 'achieved' : 'missed';
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const search = productSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(search) ||
      (p.company_name || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <Header
        title="Cycle Planning"
        buttons={[
          { onClick: handleReload, icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, title: 'Refresh' }
        ]}
      />

      {/* Cycle & Product Selectors */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cycleSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Cycle (Quarter)
            </label>
            <select
              id="cycleSelect"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              {cycleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedProductId ? (productSearch || selectedProduct?.name || '') : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  if (selectedProductId) setSelectedProductId('');
                }}
                onFocus={() => {
                  setShowProductDropdown(true);
                  if (selectedProductId) {
                    setProductSearch('');
                    setSelectedProductId('');
                  }
                }}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                placeholder="Search product by name or company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedProductId(p.id);
                        setProductSearch(p.name);
                        setShowProductDropdown(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">• {p.company_name}</span>
                    </div>
                  ))}
                </div>
              )}
              {showProductDropdown && filteredProducts.length === 0 && productSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500">No matching products found</div>
                </div>
              )}
              {selectedProductId && (
                <p className="mt-1 text-xs text-green-600 flex items-center justify-between">
                  <span>Selected: {selectedProduct?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId('');
                      setProductSearch('');
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Doctor Section */}
      {selectedProductId && selectedCycle && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Add Doctor to <span className="text-primary-600">{products.find(p => p.id === selectedProductId)?.name}</span> for {getCycleLabel(selectedCycle)}
          </h3>
          <div className="relative max-w-md">
            <input
              type="text"
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              onFocus={() => setShowDoctorDropdown(true)}
              onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 200)}
              placeholder="Search doctor by name, specialization..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
            {showDoctorDropdown && filteredDoctors.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                {filteredDoctors.map(d => (
                  <div
                    key={d.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addDoctorToCycle(d.id);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="text-sm font-medium text-gray-900">{d.name}</span>
                    {d.specialization && (
                      <span className="text-xs text-gray-500 ml-2">
                        • {d.specialization}
                      </span>
                    )}
                    {d.hospital && (
                      <span className="text-xs text-gray-500 ml-2">
                        • {d.hospital}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showDoctorDropdown && filteredDoctors.length === 0 && doctorSearch && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="px-3 py-2 text-sm text-gray-500">No matching doctors found</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      {loading ? (
        <Loader />
      ) : Object.keys(plansByProduct).length > 0 ? (
        Object.entries(plansByProduct).map(([productId, { product, plans }]) => (
          <div key={productId} className="card">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {product?.name}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({product?.company_name}) — {plans.length} doctor{plans.length !== 1 ? 's' : ''}
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    {cycleMonthRanges.map((range, i) => (
                      <th key={i} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {range.label}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map(plan => {
                    const achievement = visitAchievements[plan.doctor_id] || { month1: [], month2: [], month3: [] };
                    return (
                      <tr key={plan.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{plan.doctors?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{plan.doctors?.specialization}</div>
                        </td>
                        {cycleMonthRanges.map((range, i) => {
                          const dates = achievement[`month${i + 1}`] || [];
                          const status = getMonthStatus(dates, range);
                          return (
                            <td key={i} className="px-4 py-3 text-center">
                              {status === 'upcoming' ? (
                                <div className="text-xs text-gray-400 italic">Upcoming</div>
                              ) : (
                                <div className={`rounded-lg p-2 ${
                                  status === 'achieved'
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                  <div className={`text-sm font-semibold ${
                                    status === 'achieved' ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {dates.length} visit{dates.length !== 1 ? 's' : ''}
                                  </div>
                                  {dates.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {dates.map(d => format(new Date(d + 'T00:00:00'), 'MMM d')).join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeDoctorFromCycle(plan.id, plan.doctors?.name)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove from cycle"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-500">
            {!selectedCycle
              ? 'Select a cycle quarter to view or create plans.'
              : 'No doctors assigned to any product for this cycle. Select a product and add doctors above.'}
          </div>
        </div>
      )}
    </div>
  );
}

export default CyclePlanning;
