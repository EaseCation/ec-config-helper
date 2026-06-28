const ECAPI_API_KEY_KEY = 'ECAPI_API_KEY';
const ECAPI_BASE_URL_KEY = 'ECAPI_BASE_URL';
const DEFAULT_ECAPI_BASE_URL = 'https://api.easecation.net';

let memoryApiKey: string | null = null;
let memoryBaseUrl: string | null = null;

function readEnv(name: string): string | undefined {
  if (typeof import.meta !== 'undefined') {
    const value = (import.meta as any).env?.[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  if (typeof process !== 'undefined') {
    const value = process.env?.[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function getEcapiApiKey(): string | null {
  if (memoryApiKey) return memoryApiKey;
  const envKey = readEnv('VITE_ECAPI_API_KEY') || readEnv('ECAPI_API_KEY');
  if (envKey) return envKey;
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(ECAPI_API_KEY_KEY) || null;
  }
  return null;
}

export function setEcapiApiKey(apiKey: string | null): void {
  const value = apiKey?.trim() || null;
  memoryApiKey = value;
  if (typeof localStorage === 'undefined') return;
  if (value) {
    localStorage.setItem(ECAPI_API_KEY_KEY, value);
  } else {
    localStorage.removeItem(ECAPI_API_KEY_KEY);
  }
}

export function getEcapiBaseUrl(): string {
  if (memoryBaseUrl) return memoryBaseUrl;
  const envUrl = readEnv('VITE_ECAPI_BASE_URL') || readEnv('ECAPI_BASE_URL');
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(ECAPI_BASE_URL_KEY)?.trim();
    if (stored) return stored.replace(/\/$/, '');
  }
  return DEFAULT_ECAPI_BASE_URL;
}

export function setEcapiBaseUrl(baseUrl: string | null): void {
  const value = baseUrl?.trim().replace(/\/$/, '') || null;
  memoryBaseUrl = value;
  if (typeof localStorage === 'undefined') return;
  if (value && value !== DEFAULT_ECAPI_BASE_URL) {
    localStorage.setItem(ECAPI_BASE_URL_KEY, value);
  } else {
    localStorage.removeItem(ECAPI_BASE_URL_KEY);
  }
}

export { DEFAULT_ECAPI_BASE_URL };
