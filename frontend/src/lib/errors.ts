// Error parsing utilities for contract errors

export function parseContractError(error: unknown): string {
  const errorMessage = (error as Error)?.message || String(error);
  
  // Custom contract errors
  if (errorMessage.includes('ZeroAmount')) return 'Amount must be greater than zero';
  if (errorMessage.includes('ZeroAddress')) return 'Invalid recipient address';
  if (errorMessage.includes('NotOperator')) return 'Operator access required';
  if (errorMessage.includes('InvalidStrategy')) return 'The selected strategy is not registered';
  if (errorMessage.includes('ExceedsAllocationCap')) return 'This would exceed the strategy allocation limit';
  if (errorMessage.includes('InsufficientStrategyBalance')) return 'The source strategy does not have enough funds';
  if (errorMessage.includes('SameStrategy')) return 'Cannot rebalance to the same strategy';
  if (errorMessage.includes('StrategyNotEmpty')) return 'Strategy must be empty before removal';
  if (errorMessage.includes('Pausable: paused') || errorMessage.includes('EnforcedPause')) {
    return 'The vault is currently paused. Deposits are temporarily disabled.';
  }
  
  // User rejection
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return 'Transaction cancelled';
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('exceeds balance')) {
    return 'Insufficient funds for this transaction';
  }
  
  // Gas estimation failed
  if (errorMessage.includes('gas') && errorMessage.includes('estimate')) {
    return 'Transaction would fail. Please check your inputs.';
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
    return 'Network error. Please try again.';
  }
  
  // Return shortened original if nothing matches
  if (errorMessage.length > 100) {
    return errorMessage.substring(0, 100) + '...';
  }
  
  return errorMessage || 'Transaction failed';
}

export function isUserRejection(error: unknown): boolean {
  const errorMessage = (error as Error)?.message || String(error);
  return (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('User denied')
  );
}
