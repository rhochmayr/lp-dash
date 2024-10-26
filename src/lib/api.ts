import { WalletTransaction, TransactionsByDate, NodeMetrics, NodeStats } from '@/types';

const API_BASE = 'https://api-sepolia.arbiscan.io/api';
const START_BLOCK = 59995526;
const TARGET_METHOD_ID = '0xda8accf9';

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

      if (data.status === '0') {
        throw new Error(data.message || 'API request failed');
      }

      if (data.result.length < offset) {
        hasMore = false;
      } else {
        endBlock = data.result[data.result.length - 1].blockNumber;
      }

      const transactions = data.result
        .filter((tx: any) => tx.methodId === TARGET_METHOD_ID)
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
      console.error('Error fetching transactions:', error);
      hasMore = false;
    }

    // Add a small delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allResults;
}

export function groupTransactionsByDate(
  transactions: WalletTransaction[],
): TransactionsByDate {
  const byDate = transactions.reduce((acc, tx) => {
    const dateStr = tx.timestamp.toISOString().split('T')[0];
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
  const dateStr = date.toISOString().split('T')[0];
  const dayTransactions = transactions.filter(
    tx => tx.timestamp.toISOString().split('T')[0] === dateStr
  );

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = dayTransactions.filter(tx => 
      tx.timestamp.getUTCHours() === hour
    );

    return {
      type1: hourTransactions.length >= 1,
      type2: hourTransactions.length >= 2,
      transactions: hourTransactions,
    };
  });

  return hours;
}

export async function fetchNodeMetrics(): Promise<Record<string, NodeMetrics>> {
  try {
    const response = await fetch('https://jsondatapoint.blob.core.windows.net/jsondata/nodemetrics.json');
    const data = await response.json();

    return data.reduce((acc: Record<string, NodeMetrics>, node: any) => {
      const address = node.ID.toLowerCase();
      acc[address] = {
        cpu: node.CPU,
        gpu: node.GPU,
        ram: node.RAM,
        online: node.Online,
        connectedSince: new Date(node.ConnectedSince),
        location: {
          country: node.CountryCode,
          city: node.City,
        },
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching node metrics:', error);
    return {};
  }
}

export async function fetchNodeStats(): Promise<Record<string, NodeStats>> {
  try {
    const response = await fetch('https://jsondatapoint.blob.core.windows.net/jsondata/nodestats.json');
    const data = await response.json();

    return data.reduce((acc: Record<string, NodeStats>, node: any) => {
      const address = node.Wallet.toLowerCase();
      acc[address] = {
        rank: node.Rank,
        energy: node.Energy,
        totalOnlineHours: node.TotalOnlineHours,
        consecutiveDaysOnline: node.ConsecutiveDaysOnline,
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching node stats:', error);
    return {};
  }
}
