import type { Transaction, TransactionsByDate, TransactionHour } from './transactions';

export interface NodeLocation {
  city: string;
  country: string;
}

export interface NodeMetrics {
  online: boolean;
  cpu: number;
  gpu: number;
  ram: number;
  connectedSince: Date;
  location?: NodeLocation;
}

export interface NodeStats {
  rank: number;
  energy: number;
  totalOnlineHours: number;
  consecutiveDaysOnline: number;
}

export interface NodeData {
  address: string;
  name?: string;
  transactions: Transaction[];
  transactionsByDate: TransactionsByDate;
  hours: TransactionHour[];
  isLoading?: boolean;
  metrics?: NodeMetrics;
  stats?: NodeStats;
}

export interface NodeStatus {
  address: string;
  name?: string;
  hours: TransactionHour[];
  isLoading?: boolean;
  metrics?: NodeMetrics;
  stats?: NodeStats;
}

export interface NodeMetricsProps {
  address: string;
  name?: string;
  metrics?: NodeMetrics;
  stats?: NodeStats;
  successRate: string;
  totalTransactions: number;
}

// Alias for backward compatibility
export type WalletStatus = NodeStatus;
export type WalletData = NodeData;