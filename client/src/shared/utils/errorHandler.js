import { toast } from 'react-toastify';

/**
 * Handles API errors consistently throughout the application.
 * 
 * @param {Object} error - The error object from the API request
 * @param {Object} options - Options for error handling behavior
 * @param {string} options.defaultMessage - Default message if none is available from API
 * @param {boolean} options.showToast - Whether to show a toast notification
 * @param {string} options.redirectTo - Path to redirect to after error
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, options = {}) => {
  // Default options
  const defaults = {
    defaultMessage: 'An error occurred',
    showToast: true,
    redirectTo: null,
    logToConsole: true
  };
  
  const settings = { ...defaults, ...options };
  
  // Prepare error details for logging
  const errorDetails = {
    status: error?.response?.status,
    message: error?.response?.data?.message || error.message || settings.defaultMessage,
    originalError: error,
    timestamp: new Date().toISOString()
  };
  
  // For network errors in development, show a specific message
  if (error.message === 'Network Error' && import.meta.env.DEV) {
    errorDetails.message = 'Backend connection failed. Using development mode.';
  }
  
  // Log error to console
  if (settings.logToConsole) {
    console.log('API Error:', errorDetails);
  }

  // Safely show toast (with error handling to prevent toast rendering issues)
  if (settings.showToast && typeof toast === 'function') {
    try {
      // Use a simpler message for the toast to avoid rendering issues
      const safeMessage = errorDetails.message || 'An error occurred';
      
      // Use a timeout to prevent React render cycle issues
      setTimeout(() => {
        toast.error(safeMessage, {
          autoClose: 5000,
          toastId: `error-${Date.now()}`  // Ensure unique ID
        });
      }, 0);
    } catch (toastError) {
      // If toast fails, just log it
      console.error('Toast notification failed:', toastError);
    }
  }
  
  // Handle redirect if specified
  if (settings.redirectTo) {
    window.location.href = settings.redirectTo;
  }
  
  return errorDetails;
};

/**
 * Higher-order function to wrap API calls with standardized error handling
 * @param {Function} apiCall - The API function to call
 * @param {Object} errorOptions - Options for error handling
 * @returns {Promise} The result of the API call or handled error
 */
export const withErrorHandling = (apiCall, errorOptions = {}) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      handleApiError(error, errorOptions);
      throw error; // Re-throw to allow component-level handling
    }
  };
};