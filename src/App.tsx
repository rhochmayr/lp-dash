import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Wallet, RotateCw } from 'lucide-react';
import { WalletStatusGrid } from '@/components/WalletStatusGrid';
import { fetchWalletTransactions, groupTransactionsByDate, getHourlyTransactions } from '@/lib/api';
import type { WalletData, WalletStatus } from '@/types';

const REFRESH_INTERVAL = 300000; // 5 minutes
const LOCAL_STORAGE_KEY = 'walletAddresses';

function App() {
  const [date, setDate] = useState<Date>(new Date());
  const [walletsData, setWalletsData] = useState<Record<string, WalletData>>({});
  const [newWallet, setNewWallet] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(REFRESH_INTERVAL / 1000); // in seconds

  // Load wallet addresses from localStorage on mount
  useEffect(() => {
    const storedWalletAddresses = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedWalletAddresses) {
      const addresses = JSON.parse(storedWalletAddresses);
      addresses.forEach((address: string) => addWallet(address));
    }
  }, []); // Add empty dependency array to run only once on mount

  // Save wallet addresses to localStorage whenever walletsData changes
  useEffect(() => {
    const addresses = Object.keys(walletsData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(addresses));
  }, [walletsData]);

  const updateDisplayedData = useCallback((selectedDate: Date) => {
    setWalletsData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(address => {
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
    setIsRefreshing(true);
    const addresses = Object.keys(walletsData);
    
    for (const address of addresses) {
      setWalletsData(prev => ({
        ...prev,
        [address]: {
          ...prev[address],
          isLoading: true,
        },
      }));

      try {
        const transactions = await fetchWalletTransactions(address);
        const transactionsByDate = groupTransactionsByDate(transactions, address);
        
        setWalletsData(prev => ({
          ...prev,
          [address]: {
            ...prev[address],
            transactions,
            transactionsByDate,
            isLoading: false,
          },
        }));
      } catch (error) {
        console.error(`Error updating wallet ${address}:`, error);
        setWalletsData(prev => ({
          ...prev,
          [address]: {
            ...prev[address],
            isLoading: false,
          },
        }));
      }
    }
    
    updateDisplayedData(date);
    setIsRefreshing(false);
    setTimeUntilRefresh(REFRESH_INTERVAL / 1000); // Reset the timer
  }, [walletsData, date, updateDisplayedData]);

  useEffect(() => {
    const interval = setInterval(refreshWallets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshWallets]);

  useEffect(() => {
    const dates = new Set<string>();
    Object.values(walletsData).forEach(wallet => {
      Object.keys(wallet.transactionsByDate).forEach(date => dates.add(date));
    });
    
    setAvailableDates(dates);
  }, [walletsData]);

  useEffect(() => {
    updateDisplayedData(date);
  }, [date, updateDisplayedData]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeUntilRefresh(prev => (prev > 0 ? prev - 1 : REFRESH_INTERVAL / 1000));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const addWallet = async (address?: string) => {
    const walletAddress = address || newWallet;
    if (!walletAddress || walletsData[walletAddress]) return;

    const initialWalletData: WalletData = {
      address: walletAddress,
      transactions: [],
      transactionsByDate: {},
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        transactions: { type1: false, type2: false, transactions: [] },
      })),
      isLoading: true,
    };

    setWalletsData(prev => ({
      ...prev,
      [walletAddress]: initialWalletData,
    }));
    if (!address) setNewWallet('');

    try {
      const transactions = await fetchWalletTransactions(walletAddress);
      const transactionsByDate = groupTransactionsByDate(transactions, walletAddress);
      const hours = getHourlyTransactions(transactions, date);

      setWalletsData(prev => ({
        ...prev,
        [walletAddress]: {
          address: walletAddress,
          transactions,
          transactionsByDate,
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            transactions: hours[i],
          })),
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletsData(prev => {
        const newData = { ...prev };
        delete newData[walletAddress];
        return newData;
      });
    }
  };

  const removeWallet = (address: string) => {
    setWalletsData(prev => {
      const newData = { ...prev };
      delete newData[address];
      return newData;
    });
  };

  const walletStatuses: WalletStatus[] = Object.values(walletsData).map(wallet => ({
    address: wallet.address,
    hours: wallet.hours,
    isLoading: wallet.isLoading,
  }));

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-4xl font-bold tracking-tight">Lilypad</h1>
          <h1 className="text-4xl font-bold tracking-tight">RP Node Checker</h1>
          </div>
            <div className="flex items-center gap-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => !availableDates.has(date.toLocaleDateString())}
              className="rounded-md border"
            />
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Wallet</CardTitle>
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
              <Button onClick={() => addWallet()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="rounded-md border">
          <WalletStatusGrid wallets={walletStatuses} onRemoveWallet={removeWallet} selectedDate={date} />
        </ScrollArea>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshWallets}
            disabled={isRefreshing}
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />

          </Button>
          <span>{formatTime(timeUntilRefresh)}</span>
        </div>
      </div>
    </div>
  );
}

export default App;
