import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RotateCw } from 'lucide-react';

interface DashboardControlsProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  isInitialized: boolean;
  showNames: boolean;
  onShowNamesChange: (value: boolean) => void;
}

export function DashboardControls({
  onRefresh,
  isRefreshing,
  isInitialized,
  showNames,
  onShowNamesChange,
}: DashboardControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        onClick={onRefresh}
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
          onCheckedChange={onShowNamesChange}
        />
        <Label htmlFor="show-names">Show node names</Label>
      </div>
    </div>
  );
}