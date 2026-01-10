import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionModal, TransactionState } from '@/components/shared/TransactionModal';
import { useVaultData, useUserRole } from '@/hooks/useVaultData';
import { parseContractError, isUserRejection } from '@/lib/errors';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI } from '@/config/abis';
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

export function PauseControls() {
  const { paused, refetch: refetchVault } = useVaultData();
  const { isOperator, isOwner } = useUserRole();

  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txError, setTxError] = useState<string>();
  const [actionType, setActionType] = useState<'pause' | 'unpause'>('pause');

  // Pause transaction
  const {
    writeContract: writePause,
    data: pauseHash,
    isPending: isPausePending,
    error: pauseError,
    reset: resetPause,
  } = useWriteContract();

  const { isLoading: isPauseConfirming, isSuccess: isPauseSuccess } = useWaitForTransactionReceipt({
    hash: pauseHash,
  });

  // Unpause transaction
  const {
    writeContract: writeUnpause,
    data: unpauseHash,
    isPending: isUnpausePending,
    error: unpauseError,
    reset: resetUnpause,
  } = useWriteContract();

  const { isLoading: isUnpauseConfirming, isSuccess: isUnpauseSuccess } = useWaitForTransactionReceipt({
    hash: unpauseHash,
  });

  // Handle success
  useEffect(() => {
    if (isPauseSuccess || isUnpauseSuccess) {
      setTxState('success');
      refetchVault();
    }
  }, [isPauseSuccess, isUnpauseSuccess, refetchVault]);

  // Handle errors
  useEffect(() => {
    const error = pauseError || unpauseError;
    if (error) {
      if (isUserRejection(error)) {
        setTxState('cancelled');
      } else {
        setTxState('failed');
        setTxError(parseContractError(error));
      }
    }
  }, [pauseError, unpauseError]);

  // Update tx state
  useEffect(() => {
    if (isPausePending || isUnpausePending) {
      setTxState('awaiting');
    } else if (isPauseConfirming || isUnpauseConfirming) {
      setTxState('pending');
    }
  }, [isPausePending, isUnpausePending, isPauseConfirming, isUnpauseConfirming]);

  const handlePause = () => {
    setActionType('pause');
    setTxState('awaiting');
    setTxError(undefined);
    setModalOpen(true);
    resetPause();

    writePause({
      address: CONTRACTS.vault.address,
      abi: VAULT_ABI,
      functionName: 'pause',
    } as any);
  };

  const handleUnpause = () => {
    setActionType('unpause');
    setTxState('awaiting');
    setTxError(undefined);
    setModalOpen(true);
    resetUnpause();

    writeUnpause({
      address: CONTRACTS.vault.address,
      abi: VAULT_ABI,
      functionName: 'unpause',
    } as any);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTxState('idle');
    setTxError(undefined);
  };

  const handleRetry = () => {
    if (actionType === 'pause') {
      handlePause();
    } else {
      handleUnpause();
    }
  };

  const canPause = isOperator && !paused;
  const canUnpause = isOwner && paused;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="system-block"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-xl ${paused ? 'bg-warning/10 border border-warning/20' : 'bg-success/10 border border-success/20'}`}>
            {paused ? (
              <ShieldAlert className="h-5 w-5 text-warning" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-success" />
            )}
          </div>
          <h3 className="text-lg font-semibold">Vault Controls</h3>
        </div>

        <div className="space-y-4">
          {/* Status block */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div>
              <p className="font-medium">Vault Status</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {paused
                  ? 'Deposits and rebalancing are disabled'
                  : 'Vault is operating normally'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={paused
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'bg-success/10 text-success border-success/30'
              }
            >
              {paused ? 'Paused' : 'Active'}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {!paused && (
              <div className="space-y-2">
                <Button
                  onClick={handlePause}
                  disabled={!canPause || isPausePending || isPauseConfirming}
                  variant="destructive"
                  className="w-full h-11 bg-warm hover:bg-warm/90"
                >
                  {isPausePending || isPauseConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Pause Vault
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Operator can pause. This disables deposits and rebalancing.
                </p>
              </div>
            )}

            {paused && (
              <div className="space-y-2">
                <Button
                  onClick={handleUnpause}
                  disabled={!canUnpause || isUnpausePending || isUnpauseConfirming}
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                >
                  {isUnpausePending || isUnpauseConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unpausing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Unpause Vault
                    </>
                  )}
                </Button>
                {!isOwner && (
                  <p className="text-xs text-warning text-center">
                    Only the owner can unpause the vault.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Important notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-accent/50">
            <AlertTriangle className="h-4 w-4 text-accent-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="text-accent-foreground font-medium">Important</p>
              <p className="mt-0.5">Withdrawals are NEVER blocked, even when the vault is paused. Users can always exit.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        state={txState}
        txHash={actionType === 'pause' ? pauseHash : unpauseHash}
        title={actionType === 'pause' ? 'Pausing Vault' : 'Unpausing Vault'}
        description={
          txState === 'success'
            ? `Vault has been ${actionType === 'pause' ? 'paused' : 'unpaused'}`
            : undefined
        }
        error={txError}
        onRetry={handleRetry}
      />
    </>
  );
}
