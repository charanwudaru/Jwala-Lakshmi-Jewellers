'use client';

export function decodeTokenRole(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role as 'admin' | 'vendor' | undefined;
  } catch {
    return undefined;
  }
}

export function requireToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('jb_token') || '';
}
