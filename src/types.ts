export interface WalletTransaction {
  blockNumber: string;
  timestamp: Date;
  from: string;
  to?: string;
  methodId: string;
  hash: string;
  gasUsed: string;
}

export interface NodeTransaction {
  blockNumber: string;
  timestamp: Date;
  from: string;
  to?: string;
  methodId: string;
  hash: string;
  gasUsed: string;
}

export interface TransactionsByDate {
  [date: string]: WalletTransaction[];
}

export interface WalletMetrics {
  online: boolean;
  cpu: number;
  gpu: number;
  ram: number;
  connectedSince: Date;
  location?: {
    city: string;
    country: string;
  };
}

export interface NodeMetrics {
  online: boolean;
  cpu: number;
  gpu: number;
  ram: number;
  connectedSince: Date;
  location?: {
    city: string;
    country: string;
  };
}

export interface WalletStats {
  rank: number;
  energy: number;
  totalOnlineHours: number;
  consecutiveDaysOnline: number;
}

export interface NodeStats {
  rank: number;
  energy: number;
  totalOnlineHours: number;
  consecutiveDaysOnline: number;
}

export interface WalletData {
  address: string;
  name?: string;
  transactions: WalletTransaction[];
  transactionsByDate: TransactionsByDate;
  hours: {
    hour: number;
    transactions: {
      type1: boolean;
      type2: boolean;
      transactions: WalletTransaction[];
    };
  }[];
  isLoading?: boolean;
  metrics?: WalletMetrics;
  stats?: WalletStats;
}

export interface WalletStatus {
  address: string;
  name?: string;
  hours: {
    hour: number;
    transactions: {
      type1: boolean;
      type2: boolean;
      transactions: WalletTransaction[];
    };
  }[];
  isLoading?: boolean;
  metrics?: WalletMetrics;
  stats?: WalletStats;
}