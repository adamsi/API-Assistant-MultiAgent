import axios, { AxiosError, AxiosResponse } from 'axios';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true, // This enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Create a separate axios instance for auth endpoints with shorter timeout
export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000, // 3 second timeout for faster auth checks
});

// Request interceptor for adding auth headers if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors here
    return Promise.reject(error);
  }
);

// Helper function to handle axios errors
export const handleAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message as string;
    }
    if (axiosError.response?.status === 401) {
      return 'Authentication failed';
    }
    if (axiosError.response?.status === 403) {
      return 'Access denied';
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error';
    }
    return axiosError.message || 'Network error';
  }
  return 'Network error';
};

export default api; 