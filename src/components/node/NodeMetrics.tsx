import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Wallet, Clock, Cpu, MonitorSmartphone, HardDrive, Globe2, Trophy, Zap, Timer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NodeMetricsProps } from '@/types';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function NodeMetrics({ 
  address, 
  name, 
  metrics, 
  stats,
  successRate,
  totalTransactions 
}: NodeMetricsProps) {
  return (
    <div className="flex justify-between space-x-4">
      <Avatar>
        <AvatarFallback className={`${metrics?.online ? 'bg-green-500' : 'bg-red-500'}`}>
          <Wallet className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="space-y-3 flex-1">
        {name && (
          <h4 className="text-sm font-semibold">{name}</h4>
        )}
        <p className="text-xs text-muted-foreground break-all">
          {address}
        </p>

        {metrics && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Cpu className="h-3 w-3 mr-1" />
                  CPU
                </div>
                <p className="text-sm font-medium">{metrics.cpu} MHz</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <MonitorSmartphone className="h-3 w-3 mr-1" />
                  GPU
                </div>
                <p className="text-sm font-medium">{metrics.gpu}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <HardDrive className="h-3 w-3 mr-1" />
                  RAM
                </div>
                <p className="text-sm font-medium">{formatBytes(metrics.ram)}</p>
              </div>
            </div>

            {metrics.location && (
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Globe2 className="h-3 w-3 mr-1" />
                  Location
                </div>
                <p className="text-sm">
                  {metrics.location.city}, {metrics.location.country}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Connected Since
              </div>
              <p className="text-sm">
                {formatDistanceToNow(metrics.connectedSince, { addSuffix: true })}
              </p>
            </div>
          </>
        )}        
        
        {stats && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Trophy className="h-3 w-3 mr-1" />
                  Rank
                </div>
                <p className="text-sm font-medium">#{stats.rank}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  Energy
                </div>
                <p className="text-sm font-medium">{stats.energy?.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Timer className="h-3 w-3 mr-1" />
                  Online Hours
                </div>
                <p className="text-sm font-medium">{stats.totalOnlineHours}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Consecutive Days
                </div>
                <p className="text-sm font-medium">{stats.consecutiveDaysOnline}</p>
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <p className="text-sm font-medium">{successRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="text-sm font-medium">{totalTransactions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}