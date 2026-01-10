import { motion } from 'framer-motion';
import { useUserRole } from '@/hooks/useVaultData';
import { StrategyList } from './StrategyList';
import { RebalanceForm } from './RebalanceForm';
import { PauseControls } from './PauseControls';
import { ShieldCheck } from 'lucide-react';

export function OperatorPanel() {
  const { isOperator, isOwner } = useUserRole();

  // Only show to operators or owners
  if (!isOperator && !isOwner) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-8"
    >
      {/* Operator header block */}
      <div className="system-block-cold">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Operator Panel</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You have {isOwner ? 'owner' : 'operator'} access to this vault.
              {isOwner
                ? ' You can manage strategies, pause/unpause, and rebalance.'
                : ' You can pause the vault and rebalance strategies.'}
            </p>
          </div>
        </div>
      </div>

      {/* Control blocks grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StrategyList />
        <div className="space-y-6">
          <PauseControls />
          <RebalanceForm />
        </div>
      </div>
    </motion.div>
  );
}
