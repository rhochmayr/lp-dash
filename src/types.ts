export interface WalletTransaction {
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

export interface WalletData {
  address: string;
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
}

export interface WalletStatus {
  address: string;
  hours: {
    hour: number;
    transactions: {
      type1: boolean;
      type2: boolean;
      transactions: WalletTransaction[];
    };
  }[];
  isLoading?: boolean;
}