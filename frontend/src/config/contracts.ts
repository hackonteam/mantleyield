// MantleYield Contract Configuration
// Deployed on Mantle Sepolia (Chain ID: 5003)

export const CHAIN_CONFIG = {
  mantleSepolia: {
    id: 5003,
    name: 'Mantle Sepolia',
    network: 'mantle-sepolia',
    nativeCurrency: {
      name: 'MNT',
      symbol: 'MNT',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.mantle.xyz'] },
      public: { http: ['https://rpc.sepolia.mantle.xyz'] },
    },
    blockExplorers: {
      default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
    },
    testnet: true,
  },
} as const;

export const CONTRACTS = {
  vault: {
    address: '0x1b103d5cda535797fd810e2489a864d8186700c7' as `0x${string}`,
  },
  asset: {
    address: '0x33222b6c122d246b09737f66ef35552b966f35cc' as `0x${string}`,
  },
  idleStrategy: {
    address: '0xd829efbf50b1d90c7406a3485c66327d931441c1' as `0x${string}`,
  },
} as const;

export const EXPLORER_URL = 'https://sepolia.mantlescan.xyz';

export function getExplorerTxUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
