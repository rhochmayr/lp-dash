import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Wallet, RotateCw } from 'lucide-react';
import { WalletStatusGrid } from '@/components/WalletStatusGrid';
import { fetchWalletTransactions, groupTransactionsByDate, getHourlyTransactions, fetchNodeMetrics, fetchNodeStats } from '@/lib/api';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { toast, Toaster } from 'sonner';
import type { WalletData, WalletStatus, NodeMetrics, NodeStats } from '@/types';

const REFRESH_INTERVAL = 300000; // 5 minutes

function App() {
  const now = new Date();
  const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  const [date, setDate] = useState<Date>(currentUTCDate);
  const [walletsData, setWalletsData] = useState<Record<string, WalletData>>({});
  const [newWallet, setNewWallet] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNames, setShowNames] = useState(() => {
    try {
      return localStorage.getItem('show-names') === 'true';
    } catch {
      return false;
    }
  });

  // New state variables to store node metrics and stats
  const [nodeMetricsData, setNodeMetricsData] = useState<Record<string, NodeMetrics>>({});
  const [nodeStatsData, setNodeStatsData] = useState<Record<string, NodeStats>>({});

  // Save show names preference
  useEffect(() => {
    localStorage.setItem('show-names', showNames.toString());
  }, [showNames]);
  const initializeWallet = useCallback(async (address: string, name?: string) => {
    const normalizedAddress = address.toLowerCase();
    try {
      const transactions = await fetchWalletTransactions(normalizedAddress);
      const transactionsByDate = groupTransactionsByDate(transactions);
      const hours = getHourlyTransactions(transactions, date);

      setWalletsData(prev => ({
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
          metrics: nodeMetricsData[normalizedAddress], // Use stored metrics
          stats: nodeStatsData[normalizedAddress],     // Use stored stats
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  }, [date, nodeMetricsData, nodeStatsData]);

  // Load saved wallets and fetch their data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialized) return;
      
      const savedData = loadFromStorage();

      // Fetch node metrics and stats first
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
      
      // First, set initial state with loading indicators
      const initialWallets = Object.entries(savedData.wallets).reduce((acc, [address, data]) => {
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
      }, {} as Record<string, WalletData>);

      setWalletsData(initialWallets);

      const addresses = Object.keys(initialWallets);

      // Fetch all wallet transactions concurrently
      await Promise.all(addresses.map(address => initializeWallet(address, savedData.wallets[address].name)));

      setIsInitialized(true);
    };

    loadInitialData();
  }, [initializeWallet, date, isInitialized, nodeMetricsData, nodeStatsData]);

  // Save wallets whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    saveToStorage(walletsData);
  }, [walletsData, isInitialized]);

  const updateDisplayedData = useCallback((selectedDate: Date) => {
    setWalletsData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(address => {
        if (!address) return;
        const hours = getHourlyTransactions(updated[address].transactions, selectedDate);
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

      // Fetch all wallet transactions sequentially or concurrently
      for (const [index, address] of addresses.entries()) {
        if (!address) continue;
        try {
          const normalizedAddress = address.toLowerCase();
          const transactions = await fetchWalletTransactions(normalizedAddress);
          const transactionsByDate = groupTransactionsByDate(transactions);
          
          setWalletsData(prev => ({
            ...prev,
            [normalizedAddress]: {
              ...prev[normalizedAddress],
              transactions,
              transactionsByDate,
            },
          }));

          // Update progress toast
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

      // Fetch node metrics
      toast.loading('Refreshing data...', { id: toastId, description: 'Fetching node metrics...' });
      const metrics = await fetchNodeMetrics();
      setNodeMetricsData(metrics);

      // Fetch node stats
      toast.loading('Refreshing data...', { id: toastId, description: 'Fetching node stats...' });
      const stats = await fetchNodeStats();
      setNodeStatsData(stats);

      // Update walletsData with new metrics and stats
      setWalletsData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(address => {
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
  }, [walletsData, date, updateDisplayedData, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(refreshWallets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshWallets, isInitialized]);

  useEffect(() => {
    const dates = new Set<string>();
    Object.values(walletsData).forEach(wallet => {
      if (!wallet?.transactionsByDate) return;
      Object.keys(wallet.transactionsByDate).forEach(date => dates.add(date));
    });
    
    setAvailableDates(
      Array.from(dates).map(dateStr => new Date(dateStr))
    );
  }, [walletsData]);

  useEffect(() => {
    if (!isInitialized) return;
    updateDisplayedData(date);
  }, [date, updateDisplayedData, isInitialized]);

  const addWallet = async () => {
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
      metrics: nodeMetricsData[normalizedAddress], // Use stored metrics
      stats: nodeStatsData[normalizedAddress],     // Use stored stats
      isLoading: true,
    };

    setWalletsData(prev => ({
      ...prev,
      [normalizedAddress]: initialWalletData,
    }));
    setNewWallet('');

    try {
      await initializeWallet(normalizedAddress);
      toast.success('Node added successfully');
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletsData(prev => {
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
    setWalletsData(prev => {
      const newData = { ...prev };
      delete newData[normalizedAddress];
      return newData;
    });
    toast.success('Node removed');
  };

  const updateWalletName = (address: string, name: string) => {
    if (!address) return;
    const normalizedAddress = address.toLowerCase();
    setWalletsData(prev => ({
      ...prev,
      [normalizedAddress]: {
        ...prev[normalizedAddress],
        name: name.trim() || undefined,
      },
    }));
    toast.success('Node name updated');
  };

  const walletStatuses: WalletStatus[] = Object.values(walletsData)
    .filter(wallet => wallet && wallet.address)
    .map(wallet => ({
      address: wallet.address,
      name: wallet.name,
      hours: wallet.hours,
      isLoading: wallet.isLoading,
      metrics: wallet.metrics,
      stats: wallet.stats,
    }));

  return (
    <div className="min-h-screen bg-background p-8">
      <Toaster />
      <div className="max-w-[1800px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Lilypad</h1>
            <h1 className="text-4xl font-bold tracking-tight">RP Node Checker</h1>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())))}
            disabled={(date) => {
              const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              return utcDate > currentUTCDate || (!availableDates.some(d => 
                d.getTime() === utcDate.getTime()
              ) && utcDate.getTime() !== currentUTCDate.getTime());
            }}
            className="rounded-md border"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Node</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Ethereum wallet address"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={addWallet} disabled={!isInitialized}>
                <Plus className="mr-2 h-4 w-4" />
                Add Node
              </Button>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="rounded-md border">
          <WalletStatusGrid 
            wallets={walletStatuses} 
            onRemoveWallet={removeWallet} 
            onUpdateName={updateWalletName}
            showNames={showNames}
            selectedDate={date}
          />
        </ScrollArea>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={refreshWallets}
            disabled={isRefreshing || !isInitialized}
            className="gap-2"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-2">
            <Switch
              id="show-names"
              checked={showNames}
              onCheckedChange={setShowNames}
            />
            <Label htmlFor="show-names">Show node names</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
