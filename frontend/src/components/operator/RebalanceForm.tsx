import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionModal, TransactionState } from '@/components/shared/TransactionModal';
import { useVaultData } from '@/hooks/useVaultData';
import { formatAssetDisplay, ASSET_DECIMALS } from '@/lib/format';
import { parseContractError, isUserRejection } from '@/lib/errors';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI, STRATEGY_ABI } from '@/config/abis';
import { ArrowRightLeft, Loader2, AlertTriangle } from 'lucide-react';

export function RebalanceForm() {
  const { paused, refetch: refetchVault } = useVaultData();

  const [fromStrategy, setFromStrategy] = useState<string>('');
  const [toStrategy, setToStrategy] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();

  // Get strategy address
  const { data: strategy0 } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'strategies',
    args: [0n],
  });

  // Get strategy balance
  const { data: strategyBalance, refetch: refetchBalance } = useReadContract({
    address: (fromStrategy as `0x${string}`) || CONTRACTS.idleStrategy.address,
    abi: STRATEGY_ABI,
    functionName: 'totalAssets',
    query: { enabled: !!fromStrategy },
  });

  // Parse amount
  const parsedAmount = amount ? parseUnits(amount, ASSET_DECIMALS) : 0n;

  // Rebalance transaction
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      setTxState('success');
      refetchVault();
      refetchBalance();
      setAmount('');
    }
  }, [isSuccess, refetchVault, refetchBalance]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      if (isUserRejection(writeError)) {
        setTxState('cancelled');
      } else {
        setTxState('failed');
        setErrorMessage(parseContractError(writeError));
      }
    }
  }, [writeError]);

  // Update tx state
  useEffect(() => {
    if (isPending) {
      setTxState('awaiting');
    } else if (isConfirming) {
      setTxState('pending');
    }
  }, [isPending, isConfirming]);

  const handleRebalance = () => {
    if (!fromStrategy || !toStrategy) return;

    setTxState('awaiting');
    setErrorMessage(undefined);
    setModalOpen(true);
    reset();

    writeContract({
      address: CONTRACTS.vault.address,
      abi: VAULT_ABI,
      functionName: 'rebalance',
      args: [fromStrategy as `0x${string}`, toStrategy as `0x${string}`, parsedAmount],
    } as any);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTxState('idle');
    setErrorMessage(undefined);
  };

  // Validation
  const isValidAmount = parsedAmount > 0n;
  const isSameStrategy = fromStrategy && toStrategy && fromStrategy === toStrategy;
  const exceedsBalance = strategyBalance && parsedAmount > strategyBalance;
  const canRebalance = isValidAmount && fromStrategy && toStrategy && !isSameStrategy && !exceedsBalance && !paused;

  // For now, we only have one strategy, so rebalance is limited
  const hasMultipleStrategies = false; // Would need to check if there are multiple strategies

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="system-block"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Rebalance</h3>
        </div>

        <div className="space-y-4">
          {/* Paused warning */}
          {paused && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                Rebalancing is disabled while the vault is paused.
              </p>
            </div>
          )}

          {/* Operator warning */}
          <div className="p-4 rounded-xl bg-warm/5 border border-warm/20">
            <p className="text-warm font-medium text-sm">Operator Warning</p>
            <p className="text-muted-foreground text-sm mt-1">
              Rebalancing moves REAL capital. Failed rebalances will not change state but may cost gas.
              Always verify strategy balances before rebalancing.
            </p>
          </div>

          {/* Single strategy notice */}
          {!hasMultipleStrategies && (
            <div className="p-4 rounded-xl border border-border/50 text-center">
              <p className="text-muted-foreground text-sm">
                Only one strategy is currently registered. Add more strategies to enable rebalancing.
              </p>
            </div>
          )}

          {/* Strategy selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">From Strategy</Label>
              <Select value={fromStrategy} onValueChange={setFromStrategy} disabled={!hasMultipleStrategies}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {strategy0 && (
                    <SelectItem value={strategy0 as string}>
                      Idle Strategy
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {fromStrategy && strategyBalance && (
                <p className="text-xs text-muted-foreground">
                  Balance: <span className="font-mono">{formatAssetDisplay(strategyBalance)} USDC</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">To Strategy</Label>
              <Select value={toStrategy} onValueChange={setToStrategy} disabled={!hasMultipleStrategies}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {strategy0 && (
                    <SelectItem value={strategy0 as string}>
                      Idle Strategy
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isSameStrategy && (
            <p className="text-sm text-destructive">Cannot rebalance to the same strategy</p>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="rebalance-amount" className="text-sm text-muted-foreground">Amount (USDC)</Label>
            <Input
              id="rebalance-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={paused || !hasMultipleStrategies}
              className="h-12 text-lg font-mono bg-muted/30 border-border/50 focus:border-primary/50"
            />
            {exceedsBalance && (
              <p className="text-sm text-destructive">
                Amount exceeds source strategy balance
              </p>
            )}
          </div>

          {/* Action button */}
          <Button
            onClick={handleRebalance}
            disabled={!canRebalance || isPending || isConfirming || !hasMultipleStrategies}
            className="w-full h-11 bg-primary hover:bg-primary/90"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rebalancing...
              </>
            ) : paused ? (
              'Rebalancing Paused'
            ) : (
              'Rebalance'
            )}
          </Button>
        </div>
      </motion.div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        state={txState}
        txHash={txHash}
        title="Rebalancing Strategies"
        description={txState === 'success' ? `Successfully rebalanced ${amount} USDC` : undefined}
        error={errorMessage}
        onRetry={handleRebalance}
      />
    </>
  );
}
