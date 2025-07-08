import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// Configure base API
const API_URL = import.meta.env.VITE_API_ENDPOINT || "http://localhost:8000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Debug: Log the API Base URL
console.log('API Base URL:', import.meta.env.VITE_API_ENDPOINT);

// Add request interceptor for auth token
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Add request logging
api.interceptors.request.use(config => {
  console.log('🚀 API Request:', {
    method: config.method,
    url: config.baseURL + config.url,
    data: config.data,
    headers: config.headers
  });
  return config;
});

// Add response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not a refresh token request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('auth/refresh-token')) {
            
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // No refresh token, redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                // Try to refresh the token
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken
                });
                
                const { token, refreshToken: newRefreshToken } = response.data;
                
                // Update stored tokens
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Update the original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                
                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('githubToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Special case for development mode and connection errors
        if (import.meta.env.DEV && error.message === 'Network Error') {
            console.log('Backend connection failed in development mode');
            // Don't show error toast for network errors in development
            handleApiError(error, { showToast: false });
        } else {
            // Special handling for auth errors
            if (error.response && error.response.status === 401) {
                // Clear auth tokens
                localStorage.removeItem('token');
                localStorage.removeItem('githubToken');
                
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    handleApiError(error, {
                        showToast: true,
                        defaultMessage: 'Your session has expired. Redirecting to login...',
                        redirectOnAuth: true
                    });
                } else {
                    // Still handle error but don't redirect if already on login
                    handleApiError(error, {
                        showToast: true,
                        defaultMessage: 'Authentication failed'
                    });
                }
            } else {
                // Handle other errors but don't show toast (let components decide)
                handleApiError(error, { showToast: false });
            }
        }
        return Promise.reject(error);
    }
);

// Authentication API calls
export const authAPI = {
  register: async (userData) => {
    const requestData = {
      email: userData.email,
      username: userData.username,
      password: userData.password,
      password_repeat: userData.password,
      created_at: new Date().toISOString()
    };
    
    const response = await api.post('/api/users', requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Store email-username mapping in localStorage after successful registration
    if (response.data) {
      const emailToUsernameMap = JSON.parse(localStorage.getItem('emailToUsername') || '{}');
      emailToUsernameMap[userData.email] = userData.username;
      localStorage.setItem('emailToUsername', JSON.stringify(emailToUsernameMap));
    }
    
    return response;
  },

  login: async (credentials) => {
    console.log('Login attempt with:', credentials);
    
    let usernameToSend = credentials.emailOrUsername;
    
    // Check if input looks like an email
    if (credentials.emailOrUsername.includes('@')) {
      // Try to find username from stored mapping
      const emailToUsernameMap = JSON.parse(localStorage.getItem('emailToUsername') || '{}');
      const storedUsername = emailToUsernameMap[credentials.emailOrUsername];
      
      if (storedUsername) {
        usernameToSend = storedUsername;
        console.log('Found stored username for email:', storedUsername);
      } else {
        // If no stored mapping, show helpful error
        throw new Error('Please login with your username instead of email, or register first');
      }
    }
    
    const formData = new URLSearchParams();
    formData.append('username', usernameToSend);
    formData.append('password', credentials.password);
    
    console.log('Sending to backend:', {
      username: usernameToSend,
      password: '[hidden]'
    });
    
    return api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  },
  getCurrentUser: () => api.get('/api/users/me'),
  logout: () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('githubToken'); 
  }
};

// Project API calls
export const projectsAPI = {
    getProjects: () => api.get('/api/projects'),  
    getProject: (id) => api.get(`/api/projects/${id}`),  
    createProject: (data) => api.post('/api/projects', data),  
    updateProject: (id, data) => api.put(`/api/projects/${id}`, data),  
    deleteProject: (id) => api.delete(`/api/projects/${id}`)  
};

// File API calls
export const filesAPI = {
    uploadFile: (projectId, file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post(`/api/projects/${projectId}/files`, formData, {  
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress
        });
    },
    getFileById: (id) => api.get(`/api/files/${id}`),  
    getFileStructure: (id) => api.get(`/api/files/${id}/structure`),  
    deleteFile: (id) => api.delete(`/api/files/${id}`),  
    getFilesByProjectId: (projectId) => api.get(`/api/projects/${projectId}/files`),  
    getFileContent: (id) => api.get(`/api/files/${id}/content`),  
    
    // Remove GitHub repository import logic
    processRepository: (projectId, { url, branch, onProgress }) => {
        // Only direct URL processing
        return api.post(`/api/projects/${projectId}/repository`, { url, branch }, {
            onUploadProgress: onProgress,
        });
    },
};

// Documentation API calls
export const docsAPI = {
  getDocumentation: (projectId) => api.get(`/api/projects/${projectId}/documentation`),          
  getFileDocumentation: (fileId) => api.get(`/api/files/${fileId}/documentation`),              
  generateDocumentation: (projectId) => api.post(`/api/projects/${projectId}/documentation/generate`), 
  updateDocumentation: (fileId, data) => api.put(`/api/files/${fileId}/documentation`, data),   
  exportDocumentation: (projectId, format) => 
    api.get(`/api/projects/${projectId}/documentation/export`, {                                
      params: { format },
      responseType: 'blob'
    }),
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add request interceptor to automatically add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
