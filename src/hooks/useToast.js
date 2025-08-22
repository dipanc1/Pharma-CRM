import { useState } from 'react';

const useToast = () => {
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showSuccess = (message) => {
    setToast({
      message,
      type: 'success',
      isVisible: true
    });
  };

  const showError = (message) => {
    setToast({
      message,
      type: 'error',
      isVisible: true
    });
  };

  const showWarning = (message) => {
    setToast({
      message,
      type: 'warning',
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  return {
    toast,
    showSuccess,
    showError,
    showWarning,
    hideToast
  };
};

export default useToast;
