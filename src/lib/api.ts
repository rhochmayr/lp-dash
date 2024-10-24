import { WalletTransaction, TransactionsByDate } from '@/types';

const API_BASE = 'https://api-sepolia.arbiscan.io/api';
const START_BLOCK = 59995526;

export async function fetchWalletTransactions(address: string): Promise<WalletTransaction[]> {
  const allResults: WalletTransaction[] = [];
  let endBlock = 100000000;
  const offset = 10000;
  let hasMore = true;

  while (hasMore) {
    const uri = `${API_BASE}?module=account&action=txlist&address=${address}&startblock=${START_BLOCK}&endblock=${endBlock}&offset=${offset}&sort=desc`;
    
    try {
      const response = await fetch(uri);
      const data = await response.json();

      if (data.result.length < offset) {
        hasMore = false;
      } else {
        endBlock = data.result[data.result.length - 1].blockNumber;
      }

      const transactions = data.result
        .filter((tx: any) => tx.methodId === '0xda8accf9')
        .map((tx: any) => ({
          blockNumber: tx.blockNumber,
          timestamp: new Date(tx.timeStamp * 1000), // Ensure timestamp is a Date object
          from: tx.from.toLowerCase(),
          to: tx.to?.toLowerCase(),
          methodId: tx.methodId,
          hash: tx.hash,
          gasUsed: tx.gasUsed,
        }));

      allResults.push(...transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      hasMore = false;
    }
  }

  return allResults;
}

export function groupTransactionsByDate(
  transactions: WalletTransaction[],
  address: string
): TransactionsByDate {
  const powTransactions = transactions.filter(
    tx => tx.from === address.toLowerCase() && tx.methodId === '0xda8accf9'
  );

  const byDate = powTransactions.reduce((acc, tx) => {
    const dateStr = tx.timestamp.toLocaleDateString(); // Adjust to local date string
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, WalletTransaction[]>);

  return byDate;
}

export function getHourlyTransactions(
  transactions: WalletTransaction[],
  date: Date
): { type1: boolean; type2: boolean; transactions: WalletTransaction[]; }[] {
  const dateStr = date.toLocaleDateString(); // Adjust to local date string
  const dayTransactions = transactions.filter(
    tx => tx.timestamp.toLocaleDateString() === dateStr
  );

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = dayTransactions.filter(tx => 
      tx.timestamp.getHours() === hour // Adjust to local hour
    );

    return {
      type1: hourTransactions.length >= 1,
      type2: hourTransactions.length >= 2,
      transactions: hourTransactions,
    };
  });

  return hours;
}