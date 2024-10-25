import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchWalletTransactions, groupTransactionsByDate, getHourlyTransactions, fetchNodeMetrics, fetchNodeStats } from '@/lib/api';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import type { WalletData, NodeMetrics, NodeStats } from '@/types';

const REFRESH_INTERVAL = 300000; // 5 minutes

export function useWalletData(date: Date) {
  const [walletsData, setWalletsData] = useState<Record<string, WalletData>>({});
  const [nodeMetricsData, setNodeMetricsData] = useState<Record<string, NodeMetrics>>({});
  const [nodeStatsData, setNodeStatsData] = useState<Record<string, NodeStats>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const initializeWallet = useCallback(
    async (address: string, name?: string) => {
      const normalizedAddress = address.toLowerCase();
      try {
        const transactions = await fetchWalletTransactions(normalizedAddress);
        const transactionsByDate = groupTransactionsByDate(transactions);
        const hours = getHourlyTransactions(transactions, date);

        setWalletsData((prev) => ({
          ...prev,
          [normalizedAddress]: {
            address: normalizedAddress,
            name,
            transactions,
            transactionsByDate,
            hours: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              transactions: hours[i],
            })),
            metrics: nodeMetricsData[normalizedAddress],
            stats: nodeStatsData[normalizedAddress],
            isLoading: false,
          },
        }));
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    },
    [date, nodeMetricsData, nodeStatsData]
  );

  const refreshWallets = useCallback(async () => {
    if (!isInitialized) return;

    setIsRefreshing(true);
    const addresses = Object.keys(walletsData);
    const totalWallets = addresses.length;
    let toastId: string | number | undefined;

    try {
      toastId = toast.loading(`Refreshing data...`, {
        description: `Refreshing wallet transactions...`,
      });

      for (const [index, address] of addresses.entries()) {
        if (!address) continue;
        try {
          const normalizedAddress = address.toLowerCase();
          const transactions = await fetchWalletTransactions(normalizedAddress);
          const transactionsByDate = groupTransactionsByDate(transactions);

          setWalletsData((prev) => ({
            ...prev,
            [normalizedAddress]: {
              ...prev[normalizedAddress],
              transactions,
              transactionsByDate,
            },
          }));

          toast.loading(`Refreshing data...`, {
            id: toastId,
            description: `Wallet transactions updated (${index + 1}/${totalWallets})`,
          });
        } catch (error) {
          console.error(`Error updating wallet ${address}:`, error);
          toast.error(`Failed to update ${walletsData[address].name || address}`, {
            description: 'Please try again later',
          });
        }
      }

      toast.loading('Refreshing data...', {
        id: toastId,
        description: 'Fetching node metrics...',
      });
      const metrics = await fetchNodeMetrics();
      setNodeMetricsData(metrics);

      toast.loading('Refreshing data...', {
        id: toastId,
        description: 'Fetching node stats...',
      });
      const stats = await fetchNodeStats();
      setNodeStatsData(stats);

      setWalletsData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((address) => {
          updated[address] = {
            ...updated[address],
            metrics: metrics[address],
            stats: stats[address],
          };
        });
        return updated;
      });

      updateDisplayedData(date);
      toast.success('All nodes refreshed successfully', {
        id: toastId,
      });
    } catch (error) {
      console.error('Error during refresh:', error);
      toast.error('Failed to refresh nodes', {
        id: toastId,
        description: 'Please try again later',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [walletsData, date, isInitialized]);

  const updateDisplayedData = useCallback((selectedDate: Date) => {
    setWalletsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((address) => {
        if (!address) return;
        const hours = getHourlyTransactions(
          updated[address].transactions,
          selectedDate
        );
        updated[address] = {
          ...updated[address],
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            transactions: hours[i],
          })),
        };
      });
      return updated;
    });
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialized) return;

      const savedData = loadFromStorage();

      const toastId = toast.loading('Fetching node data...');
      try {
        const metrics = await fetchNodeMetrics();
        const stats = await fetchNodeStats();

        setNodeMetricsData(metrics);
        setNodeStatsData(stats);

        toast.success('Node data fetched', { id: toastId });
      } catch (error) {
        console.error('Error fetching node data:', error);
        toast.error('Failed to fetch node data', { id: toastId });
      }

      const initialWallets = Object.entries(savedData.wallets).reduce(
        (acc, [address, data]) => {
          const normalizedAddress = address?.toLowerCase() || '';
          if (!normalizedAddress) return acc;

          return {
            ...acc,
            [normalizedAddress]: {
              address: normalizedAddress,
              name: data.name,
              transactions: [],
              transactionsByDate: {},
              hours: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                transactions: { type1: false, type2: false, transactions: [] },
              })),
              metrics: nodeMetricsData[normalizedAddress],
              stats: nodeStatsData[normalizedAddress],
              isLoading: true,
            },
          };
        },
        {} as Record<string, WalletData>
      );

      setWalletsData(initialWallets);

      const addresses = Object.keys(initialWallets);
      await Promise.all(
        addresses.map((address) =>
          initializeWallet(address, savedData.wallets[address].name)
        )
      );

      setIsInitialized(true);
    };

    loadInitialData();
  }, [initializeWallet, date, isInitialized, nodeMetricsData, nodeStatsData]);

  useEffect(() => {
    if (!isInitialized) return;
    saveToStorage(walletsData);
  }, [walletsData, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(refreshWallets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshWallets, isInitialized]);

  useEffect(() => {
    const dates = new Set<string>();
    Object.values(walletsData).forEach((wallet) => {
      if (!wallet?.transactionsByDate) return;
      Object.keys(wallet.transactionsByDate).forEach((date) => dates.add(date));
    });

    setAvailableDates(Array.from(dates).map((dateStr) => new Date(dateStr)));
  }, [walletsData]);

  useEffect(() => {
    if (!isInitialized) return;
    updateDisplayedData(date);
  }, [date, updateDisplayedData, isInitialized]);

  const addWallet = async (newWallet: string) => {
    if (!newWallet) return;
    const normalizedAddress = newWallet.toLowerCase();
    if (walletsData[normalizedAddress]) {
      toast.error('Node already exists');
      return;
    }

    const initialWalletData: WalletData = {
      address: normalizedAddress,
      transactions: [],
      transactionsByDate: {},
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        transactions: { type1: false, type2: false, transactions: [] },
      })),
      metrics: nodeMetricsData[normalizedAddress],
      stats: nodeStatsData[normalizedAddress],
      isLoading: true,
    };

    setWalletsData((prev) => ({
      ...prev,
      [normalizedAddress]: initialWalletData,
    }));

    try {
      await initializeWallet(normalizedAddress);
      toast.success('Node added successfully');
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletsData((prev) => {
        const newData = { ...prev };
        delete newData[normalizedAddress];
        return newData;
      });
      toast.error('Failed to add node', {
        description: 'Please check the address and try again',
      });
    }
  };

  const removeWallet = (address: string) => {
    if (!address) return;
    const normalizedAddress = address.toLowerCase();
    setWalletsData((prev) => {
      const newData = { ...prev };
      delete newData[normalizedAddress];
      return newData;
    });
    toast.success('Node removed');
  };

  const updateWalletName = (address: string, name: string) => {
    if (!address) return;
    const normalizedAddress = address.toLowerCase();
    setWalletsData((prev) => ({
      ...prev,
      [normalizedAddress]: {
        ...prev[normalizedAddress],
        name: name.trim() || undefined,
      },
    }));
    toast.success('Node name updated');
  };

  return {
    walletsData,
    isRefreshing,
    isInitialized,
    availableDates,
    addWallet,
    removeWallet,
    updateWalletName,
    refreshWallets,
  };
}