/**
 * Shared authentication utilities
 * Can be used in both client-side (Redux) and server-side (middleware) contexts
 */

import { api } from './api';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const AUTH_ENDPOINTS = {
  ME: '/auth/me',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  SIGNUP: '/auth/signup',
  REFRESH_TOKEN: '/auth/refresh-token',
} as const;

/**
 * Verify authentication by calling /auth/me endpoint
 * This matches the getUser thunk from authSlice
 * @param cookieHeader - Cookie header string from the request
 * @returns Promise<boolean> - true if authenticated, false otherwise
 */
export async function verifyAuth(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;

  try {
    const response = await api.get(AUTH_ENDPOINTS.ME, {
      headers: {
        Cookie: cookieHeader,
      },
      withCredentials: true,
    });

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

