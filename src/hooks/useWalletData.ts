import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWalletTransactions, groupTransactionsByDate, getHourlyTransactions, mergeTransactions, fetchNodeMetrics, fetchNodeStats } from '@/lib/api';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { TIME } from '@/constants';
import type { WalletData, NodeMetrics, NodeStats } from '@/types';

export function useWalletData(selectedDate: Date) {
  const [walletsData, setWalletsData] = useState<Record<string, WalletData>>({});
  const [nodeMetricsData, setNodeMetricsData] = useState<Record<string, NodeMetrics>>({});
  const [nodeStatsData, setNodeStatsData] = useState<Record<string, NodeStats>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [refreshingWallet, setRefreshingWallet] = useState<string | null>(null);
  const initialLoadComplete = useRef(false);

  // Update hours when date changes
  useEffect(() => {
    if (!isInitialized || !initialLoadComplete.current) return;

    setWalletsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((address) => {
        const wallet = updated[address];
        if (wallet && wallet.transactions) {
          const hours = getHourlyTransactions(wallet.transactions, selectedDate);
          updated[address] = {
            ...wallet,
            hours: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              transactions: hours[i],
            })),
          };
        }
      });
      return updated;
    });
  }, [selectedDate, isInitialized]);

  // Update available dates when wallet data changes
  useEffect(() => {
    const dates = new Set<string>();
    Object.values(walletsData).forEach((wallet) => {
      if (!wallet?.transactionsByDate) return;
      Object.keys(wallet.transactionsByDate).forEach((date) => dates.add(date));
    });

    setAvailableDates(Array.from(dates).map((dateStr) => new Date(dateStr)));
  }, [walletsData]);

  const refreshWallets = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const addresses = Object.keys(walletsData);
    const totalWallets = addresses.length;
    let toastId: string | number | undefined;

    try {
      toastId = toast.loading(`Loading data...`);

      // Fetch metrics and stats first
      const metrics = await fetchNodeMetrics();
      setNodeMetricsData(metrics);
      const stats = await fetchNodeStats();
      setNodeStatsData(stats);

      // Update wallets with metrics and stats
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

      // Sequentially fetch wallet transactions
      for (const [index, address] of addresses.entries()) {
        if (!address) continue;
        try {
          const normalizedAddress = address.toLowerCase();
          
          // Only set refreshingWallet if this is not the initial load
          if (initialLoadComplete.current) {
            setRefreshingWallet(normalizedAddress);
          }
          
          const existingWallet = walletsData[normalizedAddress];
          
          // Get the latest block number from existing transactions
          let startBlock: string | undefined;
          if (existingWallet?.transactions.length > 0) {
            const latestTx = existingWallet.transactions[0]; // Transactions are sorted desc
            startBlock = latestTx.blockNumber;
          }

          // Fetch new transactions
          const newTransactions = await fetchWalletTransactions(normalizedAddress, startBlock);
          
          // Merge with existing transactions if any
          const mergedTransactions = existingWallet?.transactions 
            ? mergeTransactions(existingWallet.transactions, newTransactions)
            : newTransactions;

          const transactionsByDate = groupTransactionsByDate(mergedTransactions);
          const hours = getHourlyTransactions(mergedTransactions, selectedDate);

          setWalletsData((prev) => ({
            ...prev,
            [normalizedAddress]: {
              ...prev[normalizedAddress],
              transactions: mergedTransactions,
              transactionsByDate,
              hours: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                transactions: hours[i],
              })),
              isLoading: false, // Clear loading state after data is loaded
            },
          }));

          if (totalWallets > 1) {
            toast.loading('Loading data...', {
              id: toastId,
              description: `Wallet ${index + 1}/${totalWallets} updated`,
            });
          }
        } catch (error) {
          console.error(`Error updating wallet ${address}:`, error);
          toast.error(`Failed to update ${walletsData[address].name || address}`, {
            description: 'Please try again later',
          });
        }
      }
      
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
        toast.success('Initial data loaded', { id: toastId });
      } else {
        toast.success('All nodes refreshed successfully', { id: toastId });
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      toast.error('Failed to load data', {
        id: toastId,
        description: 'Please try again later',
      });
    } finally {
      setIsRefreshing(false);
      setRefreshingWallet(null);
    }
  }, [walletsData, selectedDate, isRefreshing]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialized) return;

      const savedData = loadFromStorage();
      
      // Initialize wallets with basic data first
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
              isLoading: true,
            },
          };
        },
        {} as Record<string, WalletData>
      );

      setWalletsData(initialWallets);
      setIsInitialized(true);
    };

    loadInitialData();
  }, []);

  // Load wallet data after initialization
  useEffect(() => {
    const loadWalletData = async () => {
      if (!isInitialized || isRefreshing || initialLoadComplete.current) return;
      if (Object.keys(walletsData).length > 0) {
        await refreshWallets();
      }
    };

    loadWalletData();
  }, [isInitialized, walletsData, refreshWallets]);

  useEffect(() => {
    if (!isInitialized) return;
    saveToStorage(walletsData);
  }, [walletsData, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !initialLoadComplete.current) return;
    const interval = setInterval(refreshWallets, TIME.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshWallets, isInitialized]);

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
      const transactions = await fetchWalletTransactions(normalizedAddress);
      const transactionsByDate = groupTransactionsByDate(transactions);
      const hours = getHourlyTransactions(transactions, selectedDate);

      setWalletsData((prev) => ({
        ...prev,
        [normalizedAddress]: {
          ...prev[normalizedAddress],
          transactions,
          transactionsByDate,
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            transactions: hours[i],
          })),
          isLoading: false,
        },
      }));

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
    refreshingWallet,
    addWallet,
    removeWallet,
    updateWalletName,
    refreshWallets,
  };
}