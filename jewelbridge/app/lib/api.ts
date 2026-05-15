'use client';

export type ProductStatus = 'available' | 'reserved' | 'hidden';
export type RequestStatus = 'pending' | 'in_progress' | 'fulfilled';
export type Role = 'admin' | 'vendor';

export interface User {
  id: string;
  email: string;
  business_name: string;
  phone?: string | null;
  role: Role;
  is_active: boolean;
  must_change_password: boolean;
}

export interface Product {
  id: string;
  design_id: string;
  title: string;
  spec: string;
  category: string;
  image_url: string;
  image_urls?: string[] | null;
  owner_id?: string | null;
  owner?: User | null;
  status: ProductStatus;
}

export interface Inquiry {
  id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  customization_notes?: string | null;
  status: RequestStatus;
  product?: Product | null;
  vendor?: User | null;
}

export function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window === 'undefined') return 'http://localhost:8000/api';
  const host = window.location.hostname || 'localhost';
  if (host === 'localhost') return 'http://127.0.0.1:8000/api';
  return `http://${host}:8000/api`;
}

function getApiBases() {
  const primary = getApiBase();
  if (typeof window === 'undefined') return [primary];

  const bases = [
    primary,
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
  ];

  return Array.from(new Set(bases));
}

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('jb_token') || '';
}

export function clearSession() {
  if (typeof window !== 'undefined') localStorage.removeItem('jb_token');
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = init.body instanceof FormData
    ? authHeaders(init.headers)
    : authHeaders({ 'Content-Type': 'application/json', ...(init.headers || {}) });

  let res: Response | null = null;
  let lastNetworkError = '';
  try {
    for (const base of getApiBases()) {
      try {
        res = await fetch(`${base}${path}`, {
          ...init,
          headers,
        });
        lastNetworkError = '';
        break;
      } catch (err) {
        lastNetworkError = err instanceof Error ? err.message : 'network error';
      }
    }
  } finally {
    // no-op; the loop assigns res or leaves a network error for the guard below.
  }

  if (!res) {
    throw new Error(`Cannot reach FastAPI on port 8000. Make sure the backend is running, then try again. Tried: ${getApiBases().join(', ')}. Last error: ${lastNetworkError}`);
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const detail = typeof payload === 'object' && payload && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : 'Request failed.';
    if (res.status === 401 || /could not validate credentials/i.test(detail)) {
      clearSession();
      throw new Error('Your login session is missing or expired. Sign in again, then try again.');
    }
    throw new Error(detail);
  }

  return payload as T;
}

export function statusLabel(status: RequestStatus | ProductStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
