import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';

interface AddWalletFormProps {
  onAddWallet: (address: string) => void;
  isInitialized: boolean;
}

export function AddWalletForm({ onAddWallet, isInitialized }: AddWalletFormProps) {
  const [newWallet, setNewWallet] = useState('');

  const handleSubmit = () => {
    const trimmedWallet = newWallet.trim();
    onAddWallet(trimmedWallet);
    setNewWallet('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Node</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Ethereum wallet address"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!isInitialized}>
            <Plus className="mr-2 h-4 w-4" />
            Add Node
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}