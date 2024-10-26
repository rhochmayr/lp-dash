import { Card, CardContent } from '@/components/ui/card';
import { WalletGridHeader } from './wallet/WalletGridHeader';
import { WalletRow } from './wallet/WalletRow';
import type { NodeStatus } from '@/types';

interface WalletStatusGridProps {
  wallets: NodeStatus[];
  onRemoveWallet: (address: string) => void;
  onUpdateName: (address: string, name: string) => void;
  showNames: boolean;
  selectedDate: Date;
}

export function WalletStatusGrid({ 
  wallets, 
  onRemoveWallet, 
  onUpdateName, 
  showNames, 
  selectedDate 
}: WalletStatusGridProps) {
  const now = new Date();
  const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentUTCHour = now.getUTCHours();
  const isCurrentDate = selectedDate.getTime() === currentUTCDate.getTime();

  if (wallets.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No nodes added yet. Add a node using the form above.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <WalletGridHeader />
      
      {wallets.map((wallet) => (
        <Card key={`wallet-${wallet.address}`}>
          <CardContent className="p-4">
            <WalletRow
              wallet={wallet}
              showNames={showNames}
              selectedDate={selectedDate}
              onRemoveWallet={onRemoveWallet}
              onUpdateName={onUpdateName}
              currentUTCHour={currentUTCHour}
              isCurrentDate={isCurrentDate}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}