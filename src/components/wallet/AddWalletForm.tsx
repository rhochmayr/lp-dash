import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface AddWalletFormProps {
  onAddWallet: (addresses: string[]) => void;
  isInitialized: boolean;
}

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function AddWalletForm({ onAddWallet, isInitialized }: AddWalletFormProps) {
  const [newWallets, setNewWallets] = useState('');

  const handleSubmit = () => {
    const trimmedWallets = newWallets.trim();
    
    if (!trimmedWallets) {
      toast.error('Please enter one or more wallet addresses');
      return;
    }

    const addresses = trimmedWallets.split(/[\s,]+/);
    const validAddresses: string[] = [];
    const invalidAddresses: string[] = [];

    addresses.forEach((address) => {
      if (isValidEthereumAddress(address)) {
        validAddresses.push(address);
      } else {
        invalidAddresses.push(address);
      }
    });

    if (invalidAddresses.length > 0) {
      toast.error(`Invalid addresses: ${invalidAddresses.join(', ')}`);
    }

    if (validAddresses.length > 0) {
      onAddWallet(validAddresses);
    }

    setNewWallets('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Nodes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              placeholder="Enter wallet address(es)"
              value={newWallets}
              onChange={(e) => setNewWallets(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
              maxLength={2500}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!isInitialized}
            className="w-full xl:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Nodes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
