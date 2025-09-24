import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting for INR (Rupees)
export function formatINR(value: number | string | null | undefined, opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) {
  if (value === null || value === undefined || value === '') return '₹—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return '₹—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: opts?.minimumFractionDigits ?? 2, maximumFractionDigits: opts?.maximumFractionDigits ?? 2 }).format(num);
}

// Normalize Axios/FastAPI error payloads to a readable string
export function extractErrorMessage(error: any, fallback = "Something went wrong"): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    try {
      return detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
    } catch {
      return fallback;
    }
  }
  return error?.message || fallback;
}
