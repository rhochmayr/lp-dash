import { NodeStats } from '@/types';
import { API_CONFIG, ApiError } from './config';

export async function fetchNodeStats(): Promise<Record<string, NodeStats>> {
  try {
    const response = await fetch(API_CONFIG.STATS_URL);
    if (!response.ok) {
      throw new ApiError(
        'Failed to fetch stats',
        response.status,
        'STATS_ERROR'
      );
    }

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
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to fetch node stats',
      undefined,
      'STATS_ERROR'
    );
  }
}