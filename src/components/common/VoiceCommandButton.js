import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';

/**
 * Floating, draggable voice command button with recording state visualization.
 * Can be dragged anywhere on screen. Tapping triggers voice, dragging moves it.
 */
const VoiceCommandButton = ({ 
  isListening, 
  isProcessing, 
  isSupported,
  isConfigured,
  onClick, 
  className = '' 
}) => {
  const [position, setPosition] = useState({ x: null, y: null });
  const dragRef = useRef(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const buttonPosRef = useRef({ x: 0, y: 0 });

  // Initialize position on mount (bottom-left corner, clear of form elements)
  useEffect(() => {
    setPosition({
      x: 16,
      y: window.innerHeight - 80,
    });
  }, []);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const handlePointerDown = useCallback((e) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    buttonPosRef.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }
    setPosition({
      x: clamp(buttonPosRef.current.x + dx, 8, window.innerWidth - 64),
      y: clamp(buttonPosRef.current.y + dy, 8, window.innerHeight - 64),
    });
  }, []);

  const handlePointerUp = useCallback((e) => {
    isDraggingRef.current = false;
    // If user didn't drag (just tapped), trigger onClick
    if (!hasDraggedRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  if (!isSupported || !isConfigured) return null;
  if (position.x === null) return null; // Not yet initialized

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
      ref={dragRef}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      disabled={isProcessing}
      title={getTitle()}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className={`
        z-[60]
        flex items-center justify-center
        w-14 h-14 rounded-full
        text-white
        transition-shadow duration-200
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
