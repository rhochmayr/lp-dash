import { API } from '@/constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_CONFIG = {
  BASE_URL: API.ENDPOINTS.BASE,
  METRICS_URL: API.ENDPOINTS.METRICS,
  STATS_URL: API.ENDPOINTS.STATS,
  START_BLOCK: API.PARAMS.START_BLOCK,
  TARGET_METHOD_ID: API.PARAMS.TARGET_METHOD_ID,
  REQUEST_DELAY: API.PARAMS.REQUEST_DELAY,
  BATCH_SIZE: API.PARAMS.BATCH_SIZE,
} as const;