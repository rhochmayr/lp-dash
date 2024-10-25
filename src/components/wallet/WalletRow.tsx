import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { X, Pencil } from 'lucide-react';
import { NodeMetrics } from '../node/NodeMetrics';
import { WalletHourCell } from './WalletHourCell';
import type { NodeStatus } from '@/types';

interface WalletRowProps {
  wallet: NodeStatus;
  showNames: boolean;
  selectedDate: Date;
  onRemoveWallet: (address: string) => void;
  onUpdateName: (address: string, name: string) => void;
  currentUTCHour: number;
  isCurrentDate: boolean;
}

export function WalletRow({
  wallet,
  showNames,
  onRemoveWallet,
  onUpdateName,
  currentUTCHour,
  isCurrentDate,
}: WalletRowProps) {
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = () => {
    setEditingAddress(wallet.address);
    setEditName(wallet.name || '');
  };

  const saveEdit = (address: string) => {
    onUpdateName(address, editName);
    setEditingAddress(null);
  };

  const handleBlur = (address: string) => {
    saveEdit(address);
  };

  const truncateText = (text: string | undefined) => {
    if (!text) return '';
    return text.length > 24 ? `${text.slice(0, 21)}...` : text;
  };

  const getSuccessRate = () => {
    const totalHours = wallet.hours.length;
    const successfulHours = wallet.hours.filter(
      hour => hour.transactions.type1 && hour.transactions.type2
    ).length;
    return ((successfulHours / totalHours) * 100).toFixed(1);
  };

  const getTotalTransactions = () => {
    return wallet.hours.reduce((acc, hour) => 
      acc + hour.transactions.transactions.length, 0);
  };

  return (
    <div className="grid grid-cols-[250px_repeat(24,minmax(40px,1fr))] gap-2 items-center">
      <div className="flex items-center justify-between pr-4">
        {editingAddress === wallet.address ? (
          <div className="flex-1 mr-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(wallet.address);
                } else if (e.key === 'Escape') {
                  setEditingAddress(null);
                }
              }}
              onBlur={() => handleBlur(wallet.address)}
              placeholder="Enter node name"
              className="h-8"
              autoFocus
              maxLength={50}
            />
          </div>
        ) : (
          <div className="flex items-center flex-1">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="p-0 h-auto font-medium">
                  {truncateText(showNames && wallet.name ? wallet.name : wallet.address)}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-96">
                <NodeMetrics
                  address={wallet.address}
                  name={wallet.name}
                  metrics={wallet.metrics}
                  stats={wallet.stats}
                  successRate={getSuccessRate()}
                  totalTransactions={getTotalTransactions()}
                />
              </HoverCardContent>
            </HoverCard>
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={startEditing}
                className="h-7 w-7"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveWallet(wallet.address)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {wallet.isLoading ? (
        <div className="col-span-24 flex justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        wallet.hours?.map((hour) => (
          <WalletHourCell
            key={`${wallet.address}-hour-${hour.hour}`}
            hour={hour}
            wallet={wallet}
            showNames={showNames}
            isCurrentDate={isCurrentDate}
            currentUTCHour={currentUTCHour}
          />
        ))
      )}
    </div>
  );
}