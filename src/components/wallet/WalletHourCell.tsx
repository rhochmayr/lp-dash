import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, CircleDashed, Loader2 } from 'lucide-react';
import type { NodeStatus, TransactionHour, Transaction } from '@/types';

interface WalletHourCellProps {
  hour: TransactionHour;
  wallet: NodeStatus;
  showNames: boolean;
  isCurrentDate: boolean;
  currentUTCHour: number;
}

export function WalletHourCell({
  hour,
  wallet,
  showNames,
  isCurrentDate,
  currentUTCHour,
}: WalletHourCellProps) {
  const isFutureHour = isCurrentDate && hour.hour > currentUTCHour;
  const isCurrentHour = isCurrentDate && hour.hour === currentUTCHour;
  const isRefreshing = wallet.isLoading || wallet.refreshingWallet === wallet.address;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1 p-1 rounded-md bg-muted/50">
            {isFutureHour ? (
              <div className="text-center text-muted-foreground">--:--</div>
            ) : isCurrentHour && isRefreshing ? (
              <>
                <div className="flex gap-1">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                <Badge variant="secondary" className="text-[10px] h-4">
                  WAIT
                </Badge>
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
                <Badge
                  variant={!hour.transactions.type1 || !hour.transactions.type2 ? "destructive" : "default"}
                  className="text-[10px] h-4"
                >
                  {!hour.transactions.type1 || !hour.transactions.type2 ? "WAIT" : "OK"}
                </Badge>
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
            ) : isCurrentHour && isRefreshing ? (
              <p>Status: Refreshing data...</p>
            ) : isCurrentHour ? (
              <>
                <p>Status: {!hour.transactions.type1 ? 'Waiting for first transaction' : !hour.transactions.type2 ? 'Waiting for second transaction' : 'All transactions complete'}</p>
                {hour.transactions.transactions.length > 0 && (
                  <div className="space-y-1">
                    {hour.transactions.transactions.slice().reverse().map((tx: Transaction, i: number) => (
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
                  {hour.transactions.transactions.slice().reverse().map((tx: Transaction, i: number) => (
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
}