import { motion } from 'framer-motion';
import { useVaultData, useAssetBalance } from '@/hooks/useVaultData';
import { formatAssetDisplay, formatShareDisplay } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Vault, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VaultOverview() {
  const { totalAssets, totalSupply, paused, sharePrice, isLoading, refetch } = useVaultData();
  const { symbol } = useAssetBalance();

  const assetSymbol = symbol || 'USDC';

  if (isLoading) {
    return (
      <div className="system-block">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`system-block ${paused ? 'border-warning/30' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Vault className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Vault Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          {paused ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Paused
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              Active
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 hover:bg-primary/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Warning block when paused */}
      {paused && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-warning/5 border border-warning/20"
        >
          <p className="text-warning font-medium text-sm">Vault is Paused</p>
          <p className="text-muted-foreground text-sm mt-1">
            Deposits and rebalancing are temporarily disabled. Your funds are safe, and{' '}
            <strong className="text-foreground">you can withdraw at any time</strong>.
          </p>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
          <motion.p 
            key={totalAssets?.toString()}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold font-mono"
          >
            {formatAssetDisplay(totalAssets)}
            <span className="text-sm text-muted-foreground ml-2">{assetSymbol}</span>
          </motion.p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground mb-1">Total Shares</p>
          <motion.p 
            key={totalSupply?.toString()}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold font-mono"
          >
            {formatShareDisplay(totalSupply)}
          </motion.p>
        </div>
      </div>

      {/* Share price footer */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Share Price:</span>
          <span className="font-mono text-foreground">
            {totalSupply && totalSupply > 0n ? (
              <>{formatAssetDisplay(sharePrice)} {assetSymbol}</>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
