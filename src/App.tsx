import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from 'sonner';
import { WalletStatusGrid } from '@/components/WalletStatusGrid';
import { AddWalletForm } from '@/components/wallet/AddWalletForm';
import { DashboardHeader } from '@/components/header/DashboardHeader';
import { DashboardControls } from '@/components/controls/DashboardControls';
import { useWalletData } from '@/hooks/useWalletData';
import type { WalletStatus } from '@/types';

function App() {
  const now = new Date();
  const currentUTCDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const [date, setDate] = useState<Date>(currentUTCDate);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [showNames, setShowNames] = useState(() => {
    try {
      return localStorage.getItem('show-names') === 'true';
    } catch {
      return false;
    }
  });

  const {
    walletsData,
    isInitialized,
    isRefreshing,
    addWallet,
    removeWallet,
    updateWalletName,
    refreshWallets
  } = useWalletData(date);

  useEffect(() => {
    localStorage.setItem('show-names', showNames.toString());
  }, [showNames]);

  useEffect(() => {
    const dates = new Set<string>();
    Object.values(walletsData).forEach((wallet) => {
      if (!wallet?.transactionsByDate) return;
      Object.keys(wallet.transactionsByDate).forEach((date) => dates.add(date));
    });

    setAvailableDates(Array.from(dates).map((dateStr) => new Date(dateStr)));
  }, [walletsData]);

  const walletStatuses: WalletStatus[] = Object.values(walletsData)
    .filter((wallet) => wallet && wallet.address)
    .map((wallet) => ({
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
        <DashboardHeader
          date={date}
          onDateSelect={(newDate) =>
            newDate &&
            setDate(
              new Date(
                Date.UTC(
                  newDate.getFullYear(),
                  newDate.getMonth(),
                  newDate.getDate()
                )
              )
            )
          }
          availableDates={availableDates}
          currentUTCDate={currentUTCDate}
        />

        <AddWalletForm onAddWallet={addWallet} isInitialized={isInitialized} />

        <ScrollArea className="rounded-md border">
          <WalletStatusGrid
            wallets={walletStatuses}
            onRemoveWallet={removeWallet}
            onUpdateName={updateWalletName}
            showNames={showNames}
            selectedDate={date}
          />
        </ScrollArea>

        <DashboardControls
          onRefresh={refreshWallets}
          isRefreshing={isRefreshing}
          isInitialized={isInitialized}
          showNames={showNames}
          onShowNamesChange={setShowNames}
        />
      </div>
    </div>
  );
}

export default App;