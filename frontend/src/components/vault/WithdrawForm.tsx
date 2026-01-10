import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionModal, TransactionState } from '@/components/shared/TransactionModal';
import { useVaultData, useAssetBalance, useUserPosition } from '@/hooks/useVaultData';
import { formatAssetDisplay, formatShareDisplay, ASSET_DECIMALS } from '@/lib/format';
import { parseContractError, isUserRejection } from '@/lib/errors';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI } from '@/config/abis';
import { ArrowUp, Loader2, AlertTriangle, Shield } from 'lucide-react';

type WithdrawMode = 'withdraw' | 'redeem';

export function WithdrawForm() {
  const { address, isConnected } = useAccount();
  const { refetch: refetchVault } = useVaultData();
  const { symbol, refetch: refetchAsset } = useAssetBalance();
  const { userShares, maxWithdraw, refetch: refetchPosition } = useUserPosition();

  const [mode, setMode] = useState<WithdrawMode>('withdraw');
  const [amount, setAmount] = useState('');
  const [actualWithdrawnAmount, setActualWithdrawnAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txError, setTxError] = useState<string>();

  const assetSymbol = symbol || 'USDC';

  // Parse amount
  const parsedAmount = amount ? parseUnits(amount, ASSET_DECIMALS) : 0n;

  // Preview for withdraw mode (assets -> shares)
  const { data: previewSharesForWithdraw } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'previewWithdraw',
    args: [parsedAmount],
    query: { enabled: mode === 'withdraw' && parsedAmount > 0n },
  });

  // Preview for redeem mode (shares -> assets)
  const { data: previewAssetsForRedeem } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'previewRedeem',
    args: [parsedAmount],
    query: { enabled: mode === 'redeem' && parsedAmount > 0n },
  });

  // Withdraw transaction
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Handle success
  useEffect(() => {
    if (isWithdrawSuccess) {
      setTxState('success');
      refetchVault();
      refetchAsset();
      refetchPosition();
      setAmount('');
    }
  }, [isWithdrawSuccess, refetchVault, refetchAsset, refetchPosition]);

  // Handle errors
  useEffect(() => {
    if (withdrawError) {
      if (isUserRejection(withdrawError)) {
        setTxState('cancelled');
      } else {
        setTxState('failed');
        setTxError(parseContractError(withdrawError));
      }
    }
  }, [withdrawError]);

  // Update tx state
  useEffect(() => {
    if (isWithdrawPending) {
      setTxState('awaiting');
    } else if (isWithdrawConfirming) {
      setTxState('pending');
    }
  }, [isWithdrawPending, isWithdrawConfirming]);

  const handleWithdraw = () => {
    if (!address) return;

    // Store actual amount being withdrawn for success message
    const withdrawAmount = isPartialWithdraw ? formatAssetDisplay(maxWithdraw) : amount;
    setActualWithdrawnAmount(withdrawAmount);

    setTxState('awaiting');
    setTxError(undefined);
    setModalOpen(true);
    resetWithdraw();

    // Use maxWithdraw if partial, otherwise use requested amount
    const finalAmount = isPartialWithdraw ? maxWithdraw! : parsedAmount;

    if (mode === 'withdraw') {
      writeWithdraw({
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [finalAmount, address, address],
      } as any);
    } else {
      writeWithdraw({
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'redeem',
        args: [parsedAmount, address, address],
      } as any);
    }
  };

  const handleMax = () => {
    if (mode === 'withdraw' && maxWithdraw) {
      setAmount(formatAssetDisplay(maxWithdraw));
    } else if (mode === 'redeem' && userShares) {
      setAmount(formatShareDisplay(userShares));
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTxState('idle');
    setTxError(undefined);
  };

  // Check for partial withdrawal warning
  const isPartialWithdraw = mode === 'withdraw' && maxWithdraw && parsedAmount > maxWithdraw;

  // Validation
  const isValidAmount = parsedAmount > 0n;
  const hasSufficientShares = mode === 'redeem' ? userShares && parsedAmount <= userShares : true;
  const canWithdraw = isConnected && isValidAmount && hasSufficientShares;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="system-block"
      >
        <h3 className="text-lg font-semibold mb-6">Withdraw</h3>

        <div className="space-y-5">
          {/* Position summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Your Shares</p>
              <p className="font-mono font-medium">{formatShareDisplay(userShares)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Max Withdrawable</p>
              <p className="font-mono font-medium">{formatAssetDisplay(maxWithdraw)} {assetSymbol}</p>
            </div>
          </div>

          {/* Safety notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
            <Shield className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-success">
              Withdraw is always available, even when the vault is paused.
            </p>
          </div>

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={(v) => { setMode(v as WithdrawMode); setAmount(''); }}>
            <TabsList className="w-full bg-muted/30 p-1">
              <TabsTrigger value="withdraw" className="flex-1 data-[state=active]:bg-card">By Assets</TabsTrigger>
              <TabsTrigger value="redeem" className="flex-1 data-[state=active]:bg-card">By Shares</TabsTrigger>
            </TabsList>

            <TabsContent value="withdraw" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="withdraw-amount" className="text-sm text-muted-foreground">Amount ({assetSymbol})</Label>
                  <span className="text-sm text-muted-foreground">
                    Max: <span className="font-mono text-foreground">{formatAssetDisplay(maxWithdraw)} {assetSymbol}</span>
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 h-12 text-lg font-mono bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs text-primary hover:bg-primary/10"
                    onClick={handleMax}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {isValidAmount && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Shares to burn:</span>
                  <span className="font-mono font-medium">
                    {formatShareDisplay(previewSharesForWithdraw as bigint)}
                  </span>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="redeem" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="redeem-amount" className="text-sm text-muted-foreground">Shares</Label>
                  <span className="text-sm text-muted-foreground">
                    Balance: <span className="font-mono text-foreground">{formatShareDisplay(userShares)}</span>
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="redeem-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 h-12 text-lg font-mono bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs text-primary hover:bg-primary/10"
                    onClick={handleMax}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {isValidAmount && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <ArrowUp className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">You will receive:</span>
                  <span className="font-mono font-medium text-primary">
                    {formatAssetDisplay(previewAssetsForRedeem as bigint)} {assetSymbol}
                  </span>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>

          {/* Partial withdraw warning */}
          {isPartialWithdraw && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20"
            >
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-warning font-medium">Partial Withdrawal</p>
                <p className="text-muted-foreground mt-1">
                  You requested {formatAssetDisplay(parsedAmount)} {assetSymbol}, but only{' '}
                  {formatAssetDisplay(maxWithdraw)} is currently available due to strategy liquidity.
                </p>
              </div>
            </motion.div>
          )}

          {/* Action button */}
          <Button
            onClick={handleWithdraw}
            disabled={!canWithdraw || isWithdrawPending || isWithdrawConfirming}
            className="w-full h-12 text-base bg-primary hover:bg-primary/90"
          >
            {isWithdrawPending || isWithdrawConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'withdraw' ? 'Withdrawing...' : 'Redeeming...'}
              </>
            ) : isPartialWithdraw ? (
              `Withdraw Max Available (${formatAssetDisplay(maxWithdraw)} ${assetSymbol})`
            ) : (
              mode === 'withdraw' ? 'Withdraw' : 'Redeem'
            )}
          </Button>
        </div>
      </motion.div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        state={txState}
        txHash={withdrawHash}
        title={mode === 'withdraw' ? 'Withdrawing Assets' : 'Redeeming Shares'}
        description={
          txState === 'success'
            ? `Successfully ${mode === 'withdraw' ? `withdrew ${actualWithdrawnAmount} ${assetSymbol}` : `redeemed ${actualWithdrawnAmount} shares`}`
            : undefined
        }
        error={txError}
        onRetry={handleWithdraw}
      />
    </>
  );
}
