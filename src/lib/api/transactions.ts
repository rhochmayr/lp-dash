import { WalletTransaction } from '@/types';
import { API_CONFIG, ApiError } from './config';

export async function fetchWalletTransactions(
  address: string
): Promise<WalletTransaction[]> {
  const allResults: WalletTransaction[] = [];
  let endBlock = 100000000;
  let hasMore = true;

  while (hasMore) {
    const uri = `${API_CONFIG.BASE_URL}?module=account&action=txlist&address=${address}&startblock=${API_CONFIG.START_BLOCK}&endblock=${endBlock}&offset=${API_CONFIG.BATCH_SIZE}&sort=desc`;

    try {
      const response = await fetch(uri);
      const data = await response.json();

      if (data.status === '0') {
        throw new ApiError(data.message || 'API request failed');
      }

      if (data.result.length < API_CONFIG.BATCH_SIZE) {
        hasMore = false;
      } else {
        endBlock = data.result[data.result.length - 1].blockNumber;
      }

      const transactions = data.result
        .filter((tx: any) => tx.methodId === API_CONFIG.TARGET_METHOD_ID)
        .map((tx: any) => ({
          blockNumber: tx.blockNumber,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          from: tx.from.toLowerCase(),
          to: tx.to?.toLowerCase(),
          methodId: tx.methodId,
          hash: tx.hash,
          gasUsed: tx.gasUsed,
        }));

      allResults.push(...transactions);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Failed to fetch transactions',
        undefined,
        'FETCH_ERROR'
      );
    }

    await new Promise(resolve => setTimeout(resolve, API_CONFIG.REQUEST_DELAY));
  }

  return allResults;
}

export function groupTransactionsByDate(
  transactions: WalletTransaction[]
): Record<string, WalletTransaction[]> {
  return transactions.reduce((acc, tx) => {
    const dateStr = tx.timestamp.toISOString().split('T')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, WalletTransaction[]>);
}

export function getHourlyTransactions(
  transactions: WalletTransaction[],
  date: Date
): { type1: boolean; type2: boolean; transactions: WalletTransaction[] }[] {
  const dateStr = date.toISOString().split('T')[0];
  const dayTransactions = transactions.filter(
    tx => tx.timestamp.toISOString().split('T')[0] === dateStr
  );

  return Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = dayTransactions.filter(
      tx => tx.timestamp.getUTCHours() === hour
    );

    return {
      type1: hourTransactions.length >= 1,
      type2: hourTransactions.length >= 2,
      transactions: hourTransactions,
    };
  });
}