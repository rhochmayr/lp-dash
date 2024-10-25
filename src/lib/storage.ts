import { STORAGE } from '@/constants';
import type { StoredData, NodeData } from '@/types';

export function loadFromStorage(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE.KEYS.WALLET_DATA);
    if (!data) {
      return { wallets: {} };
    }

    const parsed = JSON.parse(data);
    return {
      wallets: Object.entries(parsed.wallets || {}).reduce((acc, [address, data]: [string, any]) => ({
        ...acc,
        [address.toLowerCase()]: {
          address: address.toLowerCase(),
          ...(data.name ? { name: data.name } : {}),
        },
      }), {}),
    };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return { wallets: {} };
  }
}

export function saveToStorage(walletsData: Record<string, NodeData>) {
  try {
    const dataToStore: StoredData = {
      wallets: Object.entries(walletsData).reduce((acc, [address, data]) => ({
        ...acc,
        [address.toLowerCase()]: {
          address: address.toLowerCase(),
          ...(data.name ? { name: data.name } : {}),
        },
      }), {}),
    };
    localStorage.setItem(STORAGE.KEYS.WALLET_DATA, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}