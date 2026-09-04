// Single source of truth for the backend API base URL. Never hardcode
// this string elsewhere — import API_BASE_URL from here instead.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
