import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { truncateAddress } from '@/lib/format';
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import { getExplorerAddressUrl } from '@/config/contracts';
import { mantleSepolia } from '@/config/wagmi';
import { toast } from '@/hooks/use-toast';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const isWrongNetwork = isConnected && chainId !== mantleSepolia.id;

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: 'Address copied', description: address });
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isWrongNetwork && (
        <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          Wrong Network
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 font-mono">
            <div className="h-2 w-2 rounded-full bg-success" />
            {truncateAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Connected to</p>
            <p className="font-mono text-sm">{truncateAddress(address)}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="gap-2 cursor-pointer">
            <Copy className="h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getExplorerAddressUrl(address!)}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
