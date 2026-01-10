import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReadContract, useReadContracts } from 'wagmi';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI, STRATEGY_ABI } from '@/config/abis';
import { formatAssetDisplay, truncateAddress, ASSET_DECIMALS } from '@/lib/format';
import { Layers, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExplorerAddressUrl } from '@/config/contracts';

interface StrategyInfo {
  address: `0x${string}`;
  balance: bigint;
  cap: bigint;
  utilization: number;
}

export function StrategyList() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);

  // Get first strategy (we know there's at least IdleStrategy)
  const { data: strategy0 } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'strategies',
    args: [0n],
  });

  // Get strategy details
  const { data: strategyData, isLoading, refetch } = useReadContracts({
    contracts: strategy0 ? [
      {
        address: strategy0 as `0x${string}`,
        abi: STRATEGY_ABI,
        functionName: 'totalAssets',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'strategyCap',
        args: [strategy0 as `0x${string}`],
      },
    ] : [],
    query: { enabled: !!strategy0 },
  });

  const strategyBalance = strategyData?.[0]?.result as bigint | undefined;
  const strategyCap = strategyData?.[1]?.result as bigint | undefined;

  // Calculate utilization
  const utilization = strategyCap && strategyCap > 0n && strategyBalance
    ? Number((strategyBalance * 100n) / strategyCap)
    : 0;

  // Get vault idle balance
  const { data: vaultBalance } = useReadContract({
    address: CONTRACTS.asset.address,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: [CONTRACTS.vault.address],
  });

  if (isLoading) {
    return (
      <div className="system-block">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="system-block"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Strategy Allocations</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 hover:bg-primary/10">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Idle Balance block */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Vault Idle</span>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Buffer</Badge>
            </div>
            <span className="font-mono">{formatAssetDisplay(vaultBalance)} USDC</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Funds available for immediate withdrawals
          </p>
        </div>

        {/* Strategy 0 - Idle Strategy block */}
        {strategy0 && (
          <div className="p-4 rounded-xl border border-border/50 hover:border-border-glow transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Idle Strategy</span>
                <a
                  href={getExplorerAddressUrl(strategy0 as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  {truncateAddress(strategy0 as string)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <span className="font-mono">{formatAssetDisplay(strategyBalance)} USDC</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Utilization</span>
                <span className="font-mono">{utilization.toFixed(1)}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cap: {formatAssetDisplay(strategyCap)} USDC</span>
                <span>Available: {formatAssetDisplay(strategyCap && strategyBalance ? strategyCap - strategyBalance : 0n)} USDC</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          Strategies hold real capital. Monitor balances before rebalancing.
        </p>
      </div>
    </motion.div>
  );
}
