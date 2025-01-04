import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DashboardControlsProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  isInitialized: boolean;
  showNames: boolean;
  onShowNamesChange: (value: boolean) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
}

export function DashboardControls({
  onRefresh,
  isRefreshing,
  isInitialized,
  showNames,
  onShowNamesChange,
  apiKey,
  setApiKey,
}: DashboardControlsProps) {
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setApiKeyInput(storedApiKey);
    }
  }, [setApiKey]);

  const handleSaveApiKey = () => {
    localStorage.setItem('api-key', apiKeyInput);
    setApiKey(apiKeyInput);
    toast.success('API key saved successfully');
  };

  return (
    <div className="flex flex-col wide:flex-row items-start wide:items-center gap-4">
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing || !isInitialized}
        className="gap-2 w-full wide:w-auto"
      >
        <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh Data
      </Button>
      <Separator className="hidden wide:block" orientation="vertical" />
      <div className="flex items-center space-x-2 w-full wide:w-auto">
        <Switch
          id="show-names"
          checked={showNames}
          onCheckedChange={onShowNamesChange}
        />
        <Label htmlFor="show-names">Show node names</Label>
      </div>
      <Separator className="hidden wide:block" orientation="vertical" />
      <div className="flex items-center space-x-2 w-full wide:w-auto">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Enter API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key</DialogTitle>
              <DialogDescription>
                Enter your API key to query api-sepolia.arbiscan.io.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <Button onClick={handleSaveApiKey}>Save API Key</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}