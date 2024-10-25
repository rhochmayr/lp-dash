import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2, XCircle, Loader2, Pencil, CircleDashed } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { WalletStatus } from '@/types';
import { NodeMetrics } from './NodeMetrics';
import { useState } from 'react';

interface WalletStatusGridProps {
  wallets: WalletStatus[];
  onRemoveWallet: (address: string) => void;
  onUpdateName: (address: string, name: string) => void;
  showNames: boolean;
  selectedDate: Date;
}

export function WalletStatusGrid({ wallets, onRemoveWallet, onUpdateName, showNames, selectedDate }: WalletStatusGridProps) {
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const now = new Date();
  const currentUTCDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentUTCHour = now.getUTCHours();
  const isCurrentDate = selectedDate.getTime() === currentUTCDate.getTime();

  const startEditing = (wallet: WalletStatus) => {
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

  const getSuccessRate = (wallet: WalletStatus) => {
    const totalHours = wallet.hours.length;
    const successfulHours = wallet.hours.filter(
      hour => hour.transactions.type1 && hour.transactions.type2
    ).length;
    return ((successfulHours / totalHours) * 100).toFixed(1);
  };

  const getTotalTransactions = (wallet: WalletStatus) => {
    return wallet.hours.reduce((acc, hour) => acc + hour.transactions.transactions.length, 0);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-[250px_repeat(24,minmax(40px,1fr))] gap-2 items-center px-4 text-sm text-muted-foreground">
        <div>Node Address</div>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={`header-${i}`} className="text-center">
            {i.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {wallets.map((wallet) => (
        <Card key={`wallet-${wallet.address}`}>
          <CardContent className="p-4">
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
                          successRate={getSuccessRate(wallet)}
                          totalTransactions={getTotalTransactions(wallet)}
                        />
                      </HoverCardContent>
                    </HoverCard>
                    <div className="flex items-center gap-1 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(wallet)}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                wallet.hours?.map((hour) => {
                  const isFutureHour = isCurrentDate && hour.hour > currentUTCHour;
                  const isCurrentHour = isCurrentDate && hour.hour === currentUTCHour;
                  
                  return (
                    <TooltipProvider key={`${wallet.address}-hour-${hour.hour}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 p-1 rounded-md bg-muted/50">
                            {isFutureHour ? (
                              <>
                                <div className="text-center text-muted-foreground">--:--</div>
                              </>
                            ) : isCurrentHour ? (
                              <>
                                <div className="flex gap-1">
                                  {!hour.transactions.type1 && !hour.transactions.type2 ? (
                                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                  ) : hour.transactions.type1 && !hour.transactions.type2 ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <CircleDashed className="h-4 w-4 text-muted-foreground" />
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </>
                                  )}
                                </div>
                                {!hour.transactions.type1 && !hour.transactions.type2 ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] h-4"
                                  >
                                    WAIT
                                  </Badge>
                                ) : hour.transactions.type1 && !hour.transactions.type2 ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] h-4"
                                  >
                                    WAIT
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="default"
                                    className="text-[10px] h-4"
                                  >
                                    OK
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex gap-1">
                                  {hour.transactions.type1 ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  {hour.transactions.type2 ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <Badge
                                  variant={hour.transactions.type1 && hour.transactions.type2 ? "default" : "destructive"}
                                  className="text-[10px] h-4"
                                >
                                  {hour.transactions.type1 && hour.transactions.type2 ? "OK" : "MISS"}
                                </Badge>
                              </>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <div className="space-y-2">
                            <p className="font-semibold">
                              {showNames && wallet.name ? `${wallet.name} (${wallet.address})` : wallet.address}
                            </p>
                            <p>Hour: {hour.hour.toString().padStart(2, '0')}:00 UTC</p>
                            {isFutureHour ? (
                              <p>Status: Pending - Hour not yet reached</p>
                            ) : isCurrentHour ? (
                              <>
                                <p>Status: {!hour.transactions.type1 ? 'Waiting for first transaction' : !hour.transactions.type2 ? 'Waiting for second transaction' : 'All transactions complete'}</p>
                                {hour.transactions.transactions.length > 0 && (
                                  <div className="space-y-1">
                                    {hour.transactions.transactions.slice().reverse().map((tx, i) => (
                                      <div key={`${tx.hash}-${i}`} className="text-xs">
                                        <p>Transaction {i + 1}:</p>
                                        <p>Timestamp: {new Date(tx.timestamp).toUTCString()}</p>
                                        Hash: <a href={`https://sepolia.arbiscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">{tx.hash.slice(0, 10)}...</a>
                                        <p>Gas Used: {tx.gasUsed}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <p>Status: {hour.transactions.type1 && hour.transactions.type2 ? 'All Required Transactions Present' : 'Missing Required Transactions'}</p>
                                <div className="space-y-1">
                                  {hour.transactions.transactions.slice().reverse().map((tx, i) => (
                                    <div key={`${tx.hash}-${i}`} className="text-xs">
                                      <p>Transaction {i + 1}:</p>
                                      <p>Timestamp: {new Date(tx.timestamp).toUTCString()}</p>
                                      Hash: <a href={`https://sepolia.arbiscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">{tx.hash.slice(0, 10)}...</a>
                                      <p>Gas Used: {tx.gasUsed}</p>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}