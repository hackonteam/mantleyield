import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TransactionModal, TransactionState } from '@/components/shared/TransactionModal';
import { useVaultData, useAssetBalance, useUserPosition } from '@/hooks/useVaultData';
import { formatAssetDisplay, formatShareDisplay, ASSET_DECIMALS } from '@/lib/format';
import { parseContractError, isUserRejection } from '@/lib/errors';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI, ERC20_ABI } from '@/config/abis';
import { ArrowDown, Loader2, AlertTriangle } from 'lucide-react';

export function DepositForm() {
  const { address, isConnected } = useAccount();
  const { paused, refetch: refetchVault } = useVaultData();
  const { balance, allowance, symbol, refetch: refetchAsset, refetchAllowance } = useAssetBalance();
  const { refetch: refetchPosition } = useUserPosition();

  const [amount, setAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txError, setTxError] = useState<string>();
  const [isApproving, setIsApproving] = useState(false);

  const assetSymbol = symbol || 'USDC';

  // Parse amount
  const parsedAmount = amount ? parseUnits(amount, ASSET_DECIMALS) : 0n;
  const needsApproval = parsedAmount > 0n && (!allowance || allowance < parsedAmount);

  // Preview deposit
  const { data: previewShares } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'previewDeposit',
    args: [parsedAmount],
    query: { enabled: parsedAmount > 0n },
  });

  // Approve transaction
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Deposit transaction
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setIsApproving(false);
      setTxState('idle');
      setModalOpen(false);
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess) {
      setTxState('success');
      refetchVault();
      refetchAsset();
      refetchPosition();
      setAmount('');
    }
  }, [isDepositSuccess, refetchVault, refetchAsset, refetchPosition]);

  // Handle errors
  useEffect(() => {
    const error = approveError || depositError;
    if (error) {
      if (isUserRejection(error)) {
        setTxState('cancelled');
      } else {
        setTxState('failed');
        setTxError(parseContractError(error));
      }
    }
  }, [approveError, depositError]);

  const handleApprove = () => {
    setIsApproving(true);
    setTxState('awaiting');
    setTxError(undefined);
    setModalOpen(true);
    resetApprove();

    writeApprove({
      address: CONTRACTS.asset.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.vault.address, parsedAmount],
    } as any);
  };

  const handleDeposit = () => {
    if (!address) return;

    setIsApproving(false);
    setTxState('awaiting');
    setTxError(undefined);
    setModalOpen(true);
    resetDeposit();

    writeDeposit({
      address: CONTRACTS.vault.address,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [parsedAmount, address],
    } as any);
  };

  const handleMax = () => {
    if (balance) {
      setAmount(formatAssetDisplay(balance));
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTxState('idle');
    setTxError(undefined);
  };

  const handleRetry = () => {
    if (isApproving) {
      handleApprove();
    } else {
      handleDeposit();
    }
  };

  // Update tx state based on pending/confirming
  useEffect(() => {
    if (isApprovePending || isDepositPending) {
      setTxState('awaiting');
    } else if (isApproveConfirming || isDepositConfirming) {
      setTxState('pending');
    }
  }, [isApprovePending, isDepositPending, isApproveConfirming, isDepositConfirming]);

  // Validation
  const isValidAmount = parsedAmount > 0n;
  const hasSufficientBalance = balance && parsedAmount <= balance;
  const canDeposit = isConnected && isValidAmount && hasSufficientBalance && !paused && !needsApproval;
  const canApprove = isConnected && isValidAmount && needsApproval;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="system-block"
      >
        <h3 className="text-lg font-semibold mb-6">Deposit</h3>
        
        <div className="space-y-5">
          {/* Paused warning */}
          {paused && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                Deposits are temporarily disabled while the vault is paused.
              </p>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deposit-amount" className="text-sm text-muted-foreground">Amount</Label>
              <span className="text-sm text-muted-foreground">
                Balance: <span className="font-mono text-foreground">{formatAssetDisplay(balance)} {assetSymbol}</span>
              </span>
            </div>
            <div className="relative">
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={paused}
                className="pr-20 h-12 text-lg font-mono bg-muted/30 border-border/50 focus:border-primary/50"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs text-primary hover:bg-primary/10"
                onClick={handleMax}
                disabled={paused}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Preview block */}
          {isValidAmount && previewShares !== undefined && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <ArrowDown className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">You will receive approximately:</span>
              <span className="font-mono font-medium text-primary">
                {formatShareDisplay(previewShares as bigint)} shares
              </span>
            </motion.div>
          )}

          {/* Action button */}
          {needsApproval ? (
            <Button
              onClick={handleApprove}
              disabled={!canApprove || isApprovePending || isApproveConfirming}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
            >
              {isApprovePending || isApproveConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${assetSymbol}`
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDeposit}
              disabled={!canDeposit || isDepositPending || isDepositConfirming}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
            >
              {isDepositPending || isDepositConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Depositing...
                </>
              ) : paused ? (
                'Deposits Paused'
              ) : (
                'Deposit'
              )}
            </Button>
          )}
        </div>
      </motion.div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        state={txState}
        txHash={isApproving ? approveHash : depositHash}
        title={isApproving ? 'Approving Token' : 'Depositing Assets'}
        description={txState === 'success' ? `Successfully deposited ${amount} ${assetSymbol}` : undefined}
        error={txError}
        onRetry={handleRetry}
      />
    </>
  );
}
