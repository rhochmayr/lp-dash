import { WalletData } from '@/types';

const STORAGE_KEY = 'wallet-monitor-data';

interface StoredData {
  wallets: Record<string, {
    address: string;
    name?: string;
  }>;
}

export function loadFromStorage(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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

export function saveToStorage(walletsData: Record<string, WalletData>) {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}