import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface AddWalletFormProps {
  onAddWallet: (address: string) => void;
  isInitialized: boolean;
}

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function AddWalletForm({ onAddWallet, isInitialized }: AddWalletFormProps) {
  const [newWallet, setNewWallet] = useState('');

  const handleSubmit = () => {
    const trimmedWallet = newWallet.trim();
    
    if (!trimmedWallet) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!isValidEthereumAddress(trimmedWallet)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    onAddWallet(trimmedWallet);
    setNewWallet('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Node</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Ethereum wallet address"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!isInitialized}
            className="w-full xl:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Node
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}