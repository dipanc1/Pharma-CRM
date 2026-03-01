import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ArrowPathIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * Modal that shows during voice command workflow:
 * - Listening state with live transcript
 * - Processing spinner
 * - Parsed data confirmation with inline editing
 */
const VoiceConfirmationModal = ({
  isOpen,
  state, // 'listening' | 'processing' | 'confirming' | 'saving' | 'error'
  transcript,
  interimTranscript,
  parsedData,
  error,
  fieldLabels, // { fieldName: 'Display Label', ... }
  fieldOrder,  // ['field1', 'field2', ...] - order to display fields
  onConfirm,
  onConfirmEdited,
  onRetry,
  onCancel,
  onStopListening, // callback to stop recording
}) => {
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (parsedData) {
      setEditedData({ ...parsedData });
      setIsEditing(false);
    }
  }, [parsedData]);

  if (!isOpen) return null;

  const handleFieldChange = (key, value) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
    setIsEditing(true);
  };

  const handleConfirm = () => {
    if (isEditing) {
      onConfirmEdited(editedData);
    } else {
      onConfirm();
    }
  };

  const getDisplayFields = () => {
    if (!editedData) return [];
    const order = fieldOrder || Object.keys(editedData);
    return order
      .filter(key => {
        if (editedData[key] === null || editedData[key] === undefined) return false;
        // Hide raw ID fields from user view — they see the _display name instead
        if (key.endsWith('_id') && key !== 'product_id') return false;
        return true;
      })
      .map(key => ({
        key,
        label: fieldLabels?.[key] || key.replace(/_display/g, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: editedData[key]
      }));
  };

  const renderListeningState = () => (
    <div className="text-center py-8">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-40" />
        <div className="absolute inset-1 bg-red-100 rounded-full animate-pulse opacity-60" />
        <div className="relative bg-red-500 rounded-full w-16 h-16 flex items-center justify-center">
          <MicrophoneIcon className="h-8 w-8 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Listening...</h3>
      <p className="text-sm text-gray-500 mb-4">Speak naturally, then click stop when done.</p>
      
      {/* Live transcript */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[60px] text-left mb-4">
        {transcript && (
          <span className="text-gray-900">{transcript} </span>
        )}
        {interimTranscript && (
          <span className="text-gray-400 italic">{interimTranscript}</span>
        )}
        {!transcript && !interimTranscript && (
          <span className="text-gray-400 italic">Waiting for speech...</span>
        )}
      </div>

      {/* Stop button */}
      <button
        type="button"
        onClick={onStopListening}
        className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2">
          <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
        </svg>
        Stop Recording
      </button>
    </div>
  );

  const renderProcessingState = () => (
    <div className="text-center py-8">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse" />
        <div className="relative bg-primary-500 rounded-full w-16 h-16 flex items-center justify-center">
          <SparklesIcon className="h-8 w-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Understanding your command...</h3>
      <p className="text-sm text-gray-500 mb-4">AI is extracting data from your voice input</p>
      
      {transcript && (
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-xs text-gray-500 mb-1 font-medium">You said:</p>
          <p className="text-gray-700 text-sm">"{transcript}"</p>
        </div>
      )}
    </div>
  );

  const renderConfirmingState = () => {
    const fields = getDisplayFields();
    
    // Separate regular fields from array fields (like sales items)
    const regularFields = fields.filter(f => !Array.isArray(f.value));
    const arrayFields = fields.filter(f => Array.isArray(f.value));
    
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">Review Extracted Data</h3>
        </div>
        
        {transcript && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1 font-medium">You said:</p>
            <p className="text-gray-700 text-sm">"{transcript}"</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {regularFields.map(({ key, label, value }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label className="text-sm font-medium text-gray-600 sm:w-40 flex-shrink-0">
                {label}
              </label>
              <input
                type="text"
                value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          ))}

          {/* Render array fields (like sales items) */}
          {arrayFields.map(({ key, label, value }) => (
            <div key={key} className="mt-4">
              <label className="text-sm font-medium text-gray-600 block mb-2">{label}</label>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {value.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(value[0]).filter(col => !col.endsWith('_id')).map(col => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {col.replace(/_display/g, '').replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {value.map((row, idx) => (
                        <tr key={idx}>
                          {Object.entries(row).filter(([col]) => !col.endsWith('_id')).map(([col, val]) => (
                            <td key={col} className="px-3 py-2 text-gray-700">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-3 py-2 text-gray-500 text-sm">No items</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
            Try Again
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
            >
              <CheckIcon className="h-4 w-4 mr-1.5" />
              {isEditing ? 'Save Edited Data' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderErrorState = () => (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <XMarkIcon className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-sm text-red-600 mb-6">{error}</p>
      
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <MicrophoneIcon className="h-4 w-4 mr-1.5" />
          Try Again
        </button>
      </div>
    </div>
  );

  const renderSavingState = () => (
    <div className="text-center py-8">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse" />
        <div className="relative bg-green-500 rounded-full w-16 h-16 flex items-center justify-center">
          <CheckCircleIcon className="h-8 w-8 text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving...</h3>
      <p className="text-sm text-gray-500">Adding your data to the system</p>
    </div>
  );

  const renderContent = () => {
    switch (state) {
      case 'listening':
        return renderListeningState();
      case 'processing':
        return renderProcessingState();
      case 'confirming':
        return renderConfirmingState();
      case 'saving':
        return renderSavingState();
      case 'error':
        return renderErrorState();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={state === 'confirming' || state === 'error' ? onCancel : undefined} />

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-lg">
          <div className="bg-white px-6 pt-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                  <MicrophoneIcon className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Voice Command</span>
              </div>
              {(state === 'confirming' || state === 'error') && (
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceConfirmationModal;
