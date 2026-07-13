import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://localhost:3000';

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? DEFAULT_API_URL;

export interface ApiError extends Error {
  status: number;
  data: unknown;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status} ${response.statusText}`) as ApiError;
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }

  return response.json() as Promise<T>;
}
