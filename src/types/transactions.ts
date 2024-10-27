export interface Transaction {
  blockNumber: string;
  timestamp: Date;
  from: string;
  to?: string;
  methodId: string;
  hash: string;
  gasUsed: string;
}

export interface TransactionsByDate {
  [date: string]: Transaction[];
}

export interface HourlyTransactions {
  type1: boolean;
  type2: boolean;
  transactions: Transaction[];
}

export interface TransactionHour {
  hour: number;
  transactions: HourlyTransactions;
}