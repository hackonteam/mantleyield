import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ExternalLink, Wallet } from 'lucide-react';
import { getExplorerTxUrl } from '@/config/contracts';
import { formatTxHash } from '@/lib/format';

export type TransactionState = 'idle' | 'awaiting' | 'pending' | 'success' | 'failed' | 'cancelled';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TransactionState;
  txHash?: string;
  title: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  state,
  txHash,
  title,
  description,
  error,
  onRetry,
}: TransactionModalProps) {
  const canClose = state === 'success' || state === 'failed' || state === 'cancelled' || state === 'idle';

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Status Icon */}
          {state === 'awaiting' && (
            <>
              <div className="relative">
                <Wallet className="h-12 w-12 text-primary" />
                <Loader2 className="h-6 w-6 text-primary animate-spin absolute -right-1 -bottom-1" />
              </div>
              <div className="text-center">
                <p className="font-medium">Confirm in wallet...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </>
          )}

          {state === 'pending' && (
            <>
              <Loader2 className="h-12 w-12 text-warning animate-spin" />
              <div className="text-center">
                <p className="font-medium">Processing...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for transaction confirmation
                </p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-success" />
              <div className="text-center">
                <p className="font-medium text-success">Transaction Confirmed</p>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            </>
          )}

          {state === 'failed' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-destructive">Transaction Failed</p>
                {error && (
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                )}
              </div>
            </>
          )}

          {state === 'cancelled' && (
            <>
              <XCircle className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Transaction Cancelled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You cancelled the transaction in your wallet
                </p>
              </div>
            </>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <a
              href={getExplorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="font-mono">{formatTxHash(txHash)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {state === 'failed' && onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
          {canClose && (
            <Button onClick={onClose}>
              {state === 'success' ? 'Done' : 'Dismiss'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
