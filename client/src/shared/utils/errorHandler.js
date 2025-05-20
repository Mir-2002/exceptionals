import { notifyError } from './toast';

/**
 * Handles API errors in a standardized way
 * @param {Error} error - The error object from axios
 * @param {Object} options - Configuration options
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    defaultMessage = 'An unexpected error occurred',
    logToConsole = true
  } = options;

  // Extract error details
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || defaultMessage;
  
  // Build error object with additional context
  const errorDetails = {
    status,
    message,
    originalError: error,
    timestamp: new Date().toISOString()
  };

  // Log error to console if enabled
  if (logToConsole) {
    console.error('API Error:', errorDetails);
  }

  // Show toast notification if enabled
  if (showToast) {
    let errorMessage = message;
    
    // Add status-specific messaging
    if (status === 401) {
      errorMessage = 'Your session has expired. Please login again.';
      // Optional: Redirect to login
      if (options.redirectOnAuth) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } else if (status === 403) {
      errorMessage = 'You don\'t have permission to perform this action.';
    } else if (status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (status === 422) {
      errorMessage = 'The submitted data is invalid.';
    } else if (status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    notifyError(errorMessage);
  }

  // Return standardized error object
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