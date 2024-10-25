import { NodeMetrics } from '@/types';
import { API_CONFIG, ApiError } from './config';

export async function fetchNodeMetrics(): Promise<Record<string, NodeMetrics>> {
  try {
    const response = await fetch(API_CONFIG.METRICS_URL);
    if (!response.ok) {
      throw new ApiError(
        'Failed to fetch metrics',
        response.status,
        'METRICS_ERROR'
      );
    }

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
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to fetch node metrics',
      undefined,
      'METRICS_ERROR'
    );
  }
}