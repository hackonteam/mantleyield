import { formatUnits, parseUnits } from 'viem';

// Asset decimals (USDC = 6)
export const ASSET_DECIMALS = 6;

export function formatAssetAmount(amount: bigint | undefined, decimals: number = ASSET_DECIMALS): string {
  if (amount === undefined) return '0.00';
  return formatUnits(amount, decimals);
}

export function formatAssetDisplay(amount: bigint | undefined, decimals: number = ASSET_DECIMALS): string {
  if (amount === undefined) return '0.00';
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0.00';
  if (num < 0.01) return '<0.01';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatShareDisplay(amount: bigint | undefined, decimals: number = ASSET_DECIMALS): string {
  if (amount === undefined) return '0.00';
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0.00';
  if (num < 0.0001) return '<0.0001';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function parseAssetAmount(value: string, decimals: number = ASSET_DECIMALS): bigint {
  if (!value || value === '') return 0n;
  try {
    return parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

export function truncateAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTxHash(hash: string | undefined): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
