import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useUserPosition, useAssetBalance } from '@/hooks/useVaultData';
import { formatAssetDisplay, formatShareDisplay } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Coins, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UserPosition() {
  const { isConnected } = useAccount();
  const { userShares, estimatedAssets, isLoading, refetch } = useUserPosition();
  const { balance, symbol } = useAssetBalance();

  const assetSymbol = symbol || 'USDC';

  if (!isConnected) {
    return (
      <div className="system-block">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Your Position</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Connect your wallet to view your position.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="system-block">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  const hasPosition = userShares && userShares > 0n;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="system-block"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Your Position</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} className="h-8 w-8 hover:bg-primary/10">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {hasPosition ? (
        <>
          {/* Position stats */}
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Your Shares</p>
              <motion.p 
                key={userShares?.toString()}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold font-mono"
              >
                {formatShareDisplay(userShares)}
              </motion.p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
              <motion.p 
                key={estimatedAssets?.toString()}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="text-xl font-semibold font-mono text-primary"
              >
                {formatAssetDisplay(estimatedAssets)}
                <span className="text-sm text-muted-foreground ml-2">{assetSymbol}</span>
              </motion.p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 mb-6">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-muted/30 mb-4">
            <Coins className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            No position yet. Deposit to receive vault shares.
          </p>
        </div>
      )}

      {/* Wallet balance footer */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Wallet Balance</span>
          <span className="font-mono text-foreground">
            {formatAssetDisplay(balance)} {assetSymbol}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
