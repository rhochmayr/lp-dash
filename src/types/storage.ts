export interface StoredWallet {
  address: string;
  name?: string;
}

export interface StoredData {
  wallets: Record<string, StoredWallet>;
}