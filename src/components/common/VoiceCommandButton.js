import React from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';

/**
 * Floating voice command button with recording state visualization.
 * Shows a pulsing mic when listening, spinner when processing.
 */
const VoiceCommandButton = ({ 
  isListening, 
  isProcessing, 
  isSupported,
  isConfigured,
  onClick, 
  className = '' 
}) => {
  if (!isSupported || !isConfigured) return null;

  const getButtonStyles = () => {
    if (isListening) {
      return 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse';
    }
    if (isProcessing) {
      return 'bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 cursor-wait';
    }
    return 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50';
  };

  const getTitle = () => {
    if (isListening) return 'Stop recording';
    if (isProcessing) return 'Processing voice command...';
    return 'Voice command - Click to speak';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isProcessing}
      title={getTitle()}
      className={`
        fixed bottom-6 right-6 z-[60]
        flex items-center justify-center
        w-14 h-14 rounded-full
        text-white
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-primary-300
        disabled:cursor-wait
        ${getButtonStyles()}
        ${className}
      `}
    >
      {isListening ? (
        <StopIcon className="h-6 w-6" />
      ) : isProcessing ? (
        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <MicrophoneIcon className="h-6 w-6" />
      )}

      {/* Listening ripple effect */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          <span className="absolute -inset-1 rounded-full bg-red-400 animate-pulse opacity-20" />
        </>
      )}
    </button>
  );
};

export default VoiceCommandButton;
