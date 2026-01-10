import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mantleSepolia } from '@/config/wagmi';

export function NetworkWarning() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;
  if (chainId === mantleSepolia.id) return null;

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-warning">Wrong Network</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please connect to Mantle Sepolia to use MantleYield.
          </p>
          <Button
            onClick={() => switchChain({ chainId: mantleSepolia.id })}
            disabled={isPending}
            size="sm"
            className="mt-3"
          >
            {isPending ? 'Switching...' : 'Switch to Mantle Sepolia'}
          </Button>
        </div>
      </div>
    </div>
  );
}
