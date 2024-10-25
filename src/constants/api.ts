export const API = {
  ENDPOINTS: {
    BASE: 'https://api-sepolia.arbiscan.io/api',
    METRICS: 'https://api-testnet.lilypad.tech/metrics-dashboard/nodes',
    STATS: 'https://jsondatapoint.blob.core.windows.net/jsondata/nodestats.json',
  },
  PARAMS: {
    START_BLOCK: 59995526,
    TARGET_METHOD_ID: '0xda8accf9',
    REQUEST_DELAY: 200,
    BATCH_SIZE: 10000,
  },
} as const;