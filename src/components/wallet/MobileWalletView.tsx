import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { NodeMetrics } from '../node/NodeMetrics';
import { WalletHourCell } from './WalletHourCell';
import { useState, useRef } from 'react';
import type { NodeStatus } from '@/types';

interface MobileWalletViewProps {
  wallets: NodeStatus[];
  selectedWallet: string | null;
  onWalletSelect: (address: string) => void;
  onRemoveWallet: (address: string) => void;
  onUpdateName: (address: string, name: string) => void;
  showNames: boolean;
  selectedDate: Date;
}

export function MobileWalletView({
  wallets,
  selectedWallet,
  onWalletSelect,
  onRemoveWallet,
  onUpdateName,
  showNames,
  selectedDate,
}: MobileWalletViewProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const initialLoadComplete = useRef(false);
  
  const now = new Date();
  const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentUTCHour = now.getUTCHours();
  const isCurrentDate = selectedDate.getTime() === currentUTCDate.getTime();

  // Set initialLoadComplete to true after the first render
  if (!initialLoadComplete.current && selectedWallet && !wallets.find(w => w.address === selectedWallet)?.isLoading) {
    initialLoadComplete.current = true;
  }

  if (wallets.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No nodes added yet. Add a node using the form above.
      </div>
    );
  }

  const selectedWalletData = wallets.find(w => w.address === selectedWallet);

  if (!selectedWalletData) return null;

  const getSuccessRate = () => {
    const totalHours = selectedWalletData.hours.length;
    const successfulHours = selectedWalletData.hours.filter(
      hour => hour.transactions.type1 && hour.transactions.type2
    ).length;
    return ((successfulHours / totalHours) * 100).toFixed(1);
  };

  const getTotalTransactions = () => {
    return selectedWalletData.hours.reduce((acc, hour) => 
      acc + hour.transactions.transactions.length, 0);
  };

  const handleEditName = () => {
    setEditName(selectedWalletData.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    onUpdateName(selectedWalletData.address, editName);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedWallet || undefined} onValueChange={onWalletSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a node" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.address} value={wallet.address}>
                {showNames && wallet.name ? wallet.name : wallet.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditName}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Name
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRemoveWallet(selectedWalletData.address)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Node
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node Name</DialogTitle>
            <DialogDescription>
              Enter a custom name for this node to make it easier to identify.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter node name"
              maxLength={50}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingName(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedWalletData && (
        <>
          <Card>
            <CardContent className="p-4">
              <NodeMetrics
                address={selectedWalletData.address}
                name={selectedWalletData.name}
                metrics={selectedWalletData.metrics}
                stats={selectedWalletData.stats}
                successRate={getSuccessRate()}
                totalTransactions={getTotalTransactions()}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {selectedWalletData.hours?.map((hour) => (
                  <div key={hour.hour} className="grid grid-cols-[80px_1fr] gap-4 items-center">
                    <div className="text-sm text-muted-foreground font-medium">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </div>
                    <WalletHourCell
                      hour={hour}
                      wallet={selectedWalletData}
                      showNames={showNames}
                      isCurrentDate={isCurrentDate}
                      currentUTCHour={currentUTCHour}
                      isInitialLoad={!initialLoadComplete.current}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}