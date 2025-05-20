import { toast } from 'react-toastify';

// Safe version of toast that won't crash the app
const safeToast = (type, message, options = {}) => {
  try {
    return toast[type](message, options);
  } catch (error) {
    console.error('Toast error:', error);
    return null;
  }
};

export const notifySuccess = (message) => {
  return safeToast('success', message);
};

export const notifyError = (message) => {
  return safeToast('error', message);
};

export const notifyInfo = (message) => {
  return safeToast('info', message);
};

export const notifyWarning = (message) => {
  return safeToast('warning', message);
};

export const notifyLoading = (message) => {
  return safeToast('info', message, {
    autoClose: false,
    isLoading: true,
  });
};

export const updateToast = (toastId, type, message) => {
  if (!toastId) return;
  
  try {
    toast.update(toastId, {
      render: message,
      type: type,
      autoClose: 5000,
      isLoading: false,
    });
  } catch (error) {
    console.error('Toast update error:', error);
    // Try to dismiss the toast if update fails
    try {
      toast.dismiss(toastId);
    } catch (_) {
      // Ignore errors from dismiss
    }
  }
};

export const dismissToast = (toastId) => {
  if (!toastId) return;
  
  try {
    toast.dismiss(toastId);
  } catch (error) {
    console.error('Toast dismiss error:', error);
  }
};