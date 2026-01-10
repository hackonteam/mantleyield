import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useVaultData';
import { Hexagon } from 'lucide-react';

export function Header() {
  const { isOperator, isOwner } = useUserRole();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hexagon className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl tracking-tight">MantleYield</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Sepolia Testnet
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {isOwner && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Owner
            </Badge>
          )}
          {isOperator && !isOwner && (
            <Badge className="bg-accent text-accent-foreground">
              Operator
            </Badge>
          )}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
