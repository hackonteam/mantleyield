import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { VAULT_ABI, ERC20_ABI } from '@/config/abis';

export function useVaultData() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'totalAssets',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'totalSupply',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'paused',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'operator',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'owner',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'name',
      },
      {
        address: CONTRACTS.vault.address,
        abi: VAULT_ABI,
        functionName: 'symbol',
      },
    ],
  });

  const totalAssets = data?.[0]?.result as bigint | undefined;
  const totalSupply = data?.[1]?.result as bigint | undefined;
  const paused = data?.[2]?.result as boolean | undefined;
  const operator = data?.[3]?.result as `0x${string}` | undefined;
  const owner = data?.[4]?.result as `0x${string}` | undefined;
  const vaultName = data?.[5]?.result as string | undefined;
  const vaultSymbol = data?.[6]?.result as string | undefined;

  // Calculate share price (assets per share)
  const sharePrice = totalSupply && totalSupply > 0n && totalAssets
    ? (totalAssets * BigInt(1e6)) / totalSupply
    : BigInt(1e6); // 1:1 if no shares

  return {
    totalAssets,
    totalSupply,
    paused: paused ?? false,
    operator,
    owner,
    vaultName,
    vaultSymbol,
    sharePrice,
    isLoading,
    error,
    refetch,
  };
}

export function useUserPosition() {
  const { address, isConnected } = useAccount();

  const { data: userShares, isLoading: sharesLoading, refetch: refetchShares } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: estimatedAssets, isLoading: assetsLoading, refetch: refetchAssets } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'previewRedeem',
    args: userShares ? [userShares] : undefined,
    query: { enabled: isConnected && !!userShares && userShares > 0n },
  });

  const { data: maxWithdraw, refetch: refetchMaxWithdraw } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'maxWithdraw',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: maxDeposit } = useReadContract({
    address: CONTRACTS.vault.address,
    abi: VAULT_ABI,
    functionName: 'maxDeposit',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const refetch = () => {
    refetchShares();
    refetchAssets();
    refetchMaxWithdraw();
  };

  return {
    userShares: userShares as bigint | undefined,
    estimatedAssets: estimatedAssets as bigint | undefined,
    maxWithdraw: maxWithdraw as bigint | undefined,
    maxDeposit: maxDeposit as bigint | undefined,
    isLoading: sharesLoading || assetsLoading,
    refetch,
  };
}

export function useAssetBalance() {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.asset.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.asset.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.vault.address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: symbol } = useReadContract({
    address: CONTRACTS.asset.address,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  const { data: decimals } = useReadContract({
    address: CONTRACTS.asset.address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  return {
    balance: balance as bigint | undefined,
    allowance: allowance as bigint | undefined,
    symbol: symbol as string | undefined,
    decimals: decimals as number | undefined,
    isLoading,
    refetch,
    refetchAllowance,
  };
}

export function useUserRole() {
  const { address, isConnected } = useAccount();
  const { operator, owner } = useVaultData();

  const isOperator = isConnected && address && operator &&
    address.toLowerCase() === operator.toLowerCase();
  
  const isOwner = isConnected && address && owner &&
    address.toLowerCase() === owner.toLowerCase();

  return { isOperator, isOwner };
}
