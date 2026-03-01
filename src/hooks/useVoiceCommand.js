import { useState, useRef, useCallback, useEffect } from 'react';
import { parseVoiceInput } from '../lib/gemini';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  CONFIRMING: 'confirming',
  SAVING: 'saving',
  ERROR: 'error'
};

/**
 * Custom hook for voice command functionality.
 * Uses Web Speech API for speech-to-text and Gemini for NLU.
 * 
 * @param {object} pageContext - Page-specific context for AI parsing
 * @param {object} existingData - Available data (doctors, products, etc.) 
 * @param {function} onConfirm - Callback when user confirms parsed data
 */
export default function useVoiceCommand({ pageContext, existingData = {}, onConfirm }) {
  const [state, setState] = useState(STATES.IDLE);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isStoppedManuallyRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Check if Gemini API key is configured
  const isConfigured = !!process.env.REACT_APP_GEMINI_API_KEY;

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome.');
      setState(STATES.ERROR);
      return;
    }

    if (!isConfigured) {
      setError('Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to your environment.');
      setState(STATES.ERROR);
      return;
    }

    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setParsedData(null);
    setError('');
    finalTranscriptRef.current = '';
    isStoppedManuallyRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English for pharma context
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(STATES.LISTENING);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      finalTranscriptRef.current = final;
      setTranscript(final.trim());
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please check your microphone.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setState(STATES.ERROR);
    };

    recognition.onend = () => {
      // Only auto-process if not manually stopped (stopListening handles its own processing)
      if (!isStoppedManuallyRef.current && finalTranscriptRef.current.trim()) {
        processTranscript(finalTranscriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, pageContext, existingData]);

  const stopListening = useCallback(() => {
    isStoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const finalText = finalTranscriptRef.current.trim();
    if (finalText) {
      processTranscript(finalText);
    } else {
      setState(STATES.IDLE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageContext, existingData]);

  const processTranscript = async (text) => {
    setState(STATES.PROCESSING);
    setTranscript(text);
    setInterimTranscript('');

    try {
      const result = await parseVoiceInput(text, pageContext, existingData);
      
      if (result.success) {
        setParsedData(result.data);
        setState(STATES.CONFIRMING);
      } else {
        setError(result.error);
        setState(STATES.ERROR);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process voice command. Please try again.');
      setState(STATES.ERROR);
    }
  };

  const confirmData = useCallback(async () => {
    if (parsedData && onConfirm) {
      setState(STATES.SAVING);
      try {
        await onConfirm(parsedData);
        reset();
      } catch (err) {
        setError(err.message || 'Failed to save. Please try again.');
        setState(STATES.ERROR);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedData, onConfirm]);

  const confirmEditedData = useCallback(async (editedData) => {
    if (onConfirm) {
      setState(STATES.SAVING);
      try {
        await onConfirm(editedData);
        reset();
      } catch (err) {
        setError(err.message || 'Failed to save. Please try again.');
        setState(STATES.ERROR);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onConfirm]);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState(STATES.IDLE);
    setTranscript('');
    setInterimTranscript('');
    setParsedData(null);
    setError('');
    finalTranscriptRef.current = '';
  }, []);

  const retryListening = useCallback(() => {
    reset();
    setTimeout(() => startListening(), 100);
  }, [reset, startListening]);

  return {
    // State
    state,
    isListening: state === STATES.LISTENING,
    isProcessing: state === STATES.PROCESSING,
    isConfirming: state === STATES.CONFIRMING,
    hasError: state === STATES.ERROR,
    isSaving: state === STATES.SAVING,
    isIdle: state === STATES.IDLE,

    // Data
    transcript,
    interimTranscript,
    parsedData,
    error,

    // Capabilities
    isSupported,
    isConfigured,

    // Actions
    startListening,
    stopListening,
    confirmData,
    confirmEditedData,
    reset,
    retryListening,

    // Constants
    STATES
  };
}
