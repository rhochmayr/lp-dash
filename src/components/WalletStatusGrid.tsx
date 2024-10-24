import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, XCircle, Loader2, CircleDashed } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WalletStatus } from '@/types';
import { format, isSameDay } from 'date-fns';

interface WalletStatusGridProps {
  wallets: WalletStatus[];
  onRemoveWallet: (address: string) => void;
  selectedDate: Date;
}

export function WalletStatusGrid({ wallets, onRemoveWallet, selectedDate }: WalletStatusGridProps) {
  const currentHour = new Date().getHours();

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-[250px_repeat(24,minmax(40px,1fr))] gap-2 items-center px-4 text-sm text-muted-foreground">
        <div>Wallet Address</div>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="text-center">
            {i.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>
      
      {wallets.map((wallet) => (
        <Card key={wallet.address}>
          <CardContent className="p-4">
            <div className="grid grid-cols-[250px_repeat(24,minmax(40px,1fr))] gap-2 items-center">
              <div className="flex items-center justify-between pr-4">
                <span className="font-medium truncate" title={wallet.address}>
                  {wallet.address}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveWallet(wallet.address)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {wallet.isLoading ? (
                <div className="col-span-24 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                wallet.hours.map((hour) => {
                  const isCurrentDay = isSameDay(selectedDate, new Date());
                  const isCurrentHour = hour.hour === currentHour;
                  const isFutureHour = hour.hour > currentHour;

                  return (
                    <TooltipProvider key={hour.hour}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 p-1 rounded-md bg-muted/50">
                            {isCurrentDay && isCurrentHour ? (
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
                            ) : isCurrentDay && isFutureHour ? (
                              <div className="text-center text-muted-foreground">--:--</div>
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
                        {(!isCurrentDay || hour.hour <= currentHour) && (
                          <TooltipContent className="w-80">
                            <div className="space-y-2">
                              <p className="font-semibold">Hour: {hour.hour.toString().padStart(2, '0')}:00</p>
                              <p>Status: {hour.transactions.type1 && hour.transactions.type2 ? 'All Required Transactions Present' : 'Missing Required Transactions'}</p>
                              <div className="space-y-1">
                                {hour.transactions.transactions.slice().reverse().map((tx, i) => (
                                  <div key={tx.hash} className="text-xs">
                                    <p>Transaction {i + 1}:</p>
                                    <p>Timestamp: {new Date(tx.timestamp).toUTCString()}/UTC</p>
                                    <p>Time: {format(tx.timestamp, 'HH:mm:ss')}</p>
                                    <p>
                                      Hash: <a href={`https://sepolia.arbiscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-white-500 underline">{tx.hash.slice(0, 10)}...</a>
                                    </p>
                                    <p>Gas Used: {tx.gasUsed}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TooltipContent>
                        )}
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