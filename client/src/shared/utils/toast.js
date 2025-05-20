import { toast } from 'react-toastify';

// Success notification
export const notifySuccess = (message) => {
  toast.success(message, {
    icon: '✅'
  });
};

// Error notification
export const notifyError = (message) => {
  toast.error(message, {
    icon: '❌'
  });
};

// Info notification
export const notifyInfo = (message) => {
  toast.info(message, {
    icon: 'ℹ️'
  });
};

// Warning notification
export const notifyWarning = (message) => {
  toast.warning(message, {
    icon: '⚠️'
  });
};

// Loading notification that can be updated
export const notifyLoading = (message) => {
  return toast.loading(message, {
    icon: '⏳'
  });
};

// Update a toast (useful for loading -> success/error transitions)
export const updateToast = (toastId, type, message) => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3000,
  });
};