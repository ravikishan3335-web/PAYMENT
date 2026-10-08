import { PaymentRecord, PaymentDetails } from '../types/payment';

const STORAGE_KEY = 'payment_screenshot_history_v1';

// Compress image to a lightweight thumbnail for safe localStorage quota retention
export async function createThumbnail(dataUrl: string, maxWidth = 200, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl.slice(0, 500)); // fallback
        }
      };
      img.onerror = () => resolve('');
      img.src = dataUrl;
    } catch {
      resolve('');
    }
  });
}

export function loadPaymentHistory(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load payment history:', err);
    return [];
  }
}

export function savePaymentHistory(history: PaymentRecord[]) {
  try {
    // Store items with thumbnail to ensure safe quota usage
    const serialized = JSON.stringify(history);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('LocalStorage quota exceeded, pruning old thumbnails to save space...', err);
    try {
      // Emergency pruning: strip thumbnails on older items
      const pruned = history.map((item, idx) => {
        if (idx > 5) {
          return { ...item, imageSrc: undefined, thumbnail: undefined };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch (e2) {
      console.error('Critical quota error saving history:', e2);
    }
  }
}
