import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Header, Loader, DashboardCard } from '../../components';
import { UserGroupIcon, CalendarIcon, GiftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { handleReload } from '../../helper';
import { getCycleLabel } from '../../utils/cycleUtils';

function KOL({
  selectedCycle,
  setSelectedCycle,
  cycleOptions,
  kolDoctors,
  kolVisits,
  kolGifts,
  kolNotes,
  doctorSearch,
  setDoctorSearch,
  showDoctorDropdown,
  setShowDoctorDropdown,
  filteredDoctors,
  markAsKOL,
  unmarkKOL,
  saveKOLNotes,
  savingNotes,
  loading,
  totalVisits,
  totalGiftsAmount
}) {
  // Local notes state for textareas
  const [localNotes, setLocalNotes] = useState({});

  // Sync localNotes from kolNotes prop
  useEffect(() => {
    const newLocal = {};
    kolDoctors.forEach(d => {
      newLocal[d.id] = kolNotes[d.id]?.notes || '';
    });
    setLocalNotes(newLocal);
  }, [kolNotes, kolDoctors]);

  return (
    <div className="space-y-6">
      <Header
        title="KOL Tracking"
        buttons={[
          { onClick: handleReload, icon: <ArrowPathIcon className="h-4 w-4 mr-2" />, title: 'Refresh' }
        ]}
      />

      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="kolCycleSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Cycle (Quarter)
            </label>
            <select
              id="kolCycleSelect"
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
              Mark Doctor as KOL
            </label>
            <div className="relative">
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                onFocus={() => setShowDoctorDropdown(true)}
                onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 200)}
                placeholder="Search doctor to mark as KOL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showDoctorDropdown && filteredDoctors.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                  {filteredDoctors.map(d => (
                    <div
                      key={d.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        markAsKOL(d.id);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <span className="text-sm font-medium text-gray-900">{d.name}</span>
                      {d.specialization && (
                        <span className="text-xs text-gray-500 ml-2">• {d.specialization}</span>
                      )}
                      {d.hospital && (
                        <span className="text-xs text-gray-500 ml-2">• {d.hospital}</span>
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
        </div>
      </div>

      {/* Summary Cards */}
      {kolDoctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Total KOLs"
            value={kolDoctors.length}
            icon={<UserGroupIcon className="h-8 w-8 text-purple-600" />}
          />
          <DashboardCard
            title={`Visits (${getCycleLabel(selectedCycle)})`}
            value={totalVisits}
            icon={<CalendarIcon className="h-8 w-8 text-blue-600" />}
          />
          <DashboardCard
            title={`Gifts (${getCycleLabel(selectedCycle)})`}
            value={`Rs ${totalGiftsAmount.toLocaleString('en-IN')}`}
            icon={<GiftIcon className="h-8 w-8 text-amber-600" />}
          />
        </div>
      )}

      {/* KOL Detail Cards */}
      {loading ? (
        <Loader />
      ) : kolDoctors.length > 0 ? (
        kolDoctors.map(doctor => {
          const visits = kolVisits[doctor.id] || [];
          const gifts = kolGifts[doctor.id] || [];
          const giftsTotal = gifts.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);

          return (
            <div key={doctor.id} className="card">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                  <div className="text-sm text-gray-500">
                    {doctor.specialization && <span>{doctor.specialization}</span>}
                    {doctor.hospital && <span> • {doctor.hospital}</span>}
                    {doctor.address && <span> • {doctor.address}</span>}
                    {doctor.doctor_class && (
                      <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        doctor.doctor_class === 'A' ? 'bg-green-100 text-green-800' :
                        doctor.doctor_class === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Class {doctor.doctor_class}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => unmarkKOL(doctor.id, doctor.name)}
                  className="text-red-500 hover:text-red-700 p-1 flex items-center text-sm"
                  title="Remove KOL status"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Remove KOL
                </button>
              </div>

              {/* Three Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visits Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Visits this Cycle
                    <span className="ml-2 text-xs font-normal text-gray-500">({visits.length})</span>
                  </h4>
                  {visits.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {visits.map(v => (
                        <div key={v.id} className="flex items-center justify-between text-sm border-b border-gray-100 py-1">
                          <div>
                            <span className="text-gray-900">{format(new Date(v.visit_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                            {v.notes && (
                              <span className="text-gray-400 ml-2 text-xs truncate inline-block max-w-[120px] align-bottom" title={v.notes}>
                                — {v.notes}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex px-1.5 py-0.5 text-xs rounded-full ${
                            v.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No visits recorded this cycle</p>
                  )}
                </div>

                {/* Gifts Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Gifts / Presents
                    <span className="ml-2 text-xs font-normal text-gray-500">({gifts.length})</span>
                  </h4>
                  {gifts.length > 0 ? (
                    <>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {gifts.map(g => (
                          <div key={g.id} className="flex items-center justify-between text-sm border-b border-gray-100 py-1">
                            <div>
                              <span className="text-gray-900">{format(new Date(g.transaction_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                              {g.notes && (
                                <span className="text-gray-400 ml-2 text-xs truncate inline-block max-w-[120px] align-bottom" title={g.notes}>
                                  — {g.notes}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Rs {parseFloat(g.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t text-sm font-semibold text-gray-700">
                        Total: Rs {giftsTotal.toLocaleString('en-IN')}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No gifts recorded this cycle</p>
                  )}
                </div>

                {/* Output Notes Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Output / Notes</h4>
                  <textarea
                    value={localNotes[doctor.id] || ''}
                    onChange={(e) => setLocalNotes(prev => ({ ...prev, [doctor.id]: e.target.value }))}
                    placeholder="Record outcomes, feedback, prescriptions generated..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">Saved per cycle quarter</span>
                    <button
                      onClick={() => saveKOLNotes(doctor.id, localNotes[doctor.id] || '')}
                      disabled={savingNotes[doctor.id]}
                      className="px-3 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                    >
                      {savingNotes[doctor.id] ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-500">
            No doctors are marked as Key Opinion Leaders. Use the search above to mark doctors as KOL.
          </div>
        </div>
      )}
    </div>
  );
}

export default KOL;
