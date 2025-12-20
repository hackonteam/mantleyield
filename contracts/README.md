# MantleYield Smart Contracts

## Overview

MantleYield is a composable yield router implemented as an ERC-4626 tokenized vault with modular strategy adapters. It enables users to deposit assets (USDC) and earn yield across multiple DeFi protocols on Mantle Network.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MantleYieldVault                          │
│                     (ERC-4626)                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │deposit()│ │withdraw│ │totalAsset│ │  rebalance()    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                [IStrategyAdapter]
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼────────┐              ┌────────▼────────┐
│ IdleStrategy   │              │ LendingStrategy │
│ (0% baseline)  │              │ (Real protocol) │
└────────────────┘              └─────────────────┘
```

## Contracts

### Core Contracts

- **MantleYieldVault.sol** - ERC-4626 compliant vault with strategy routing
- **IStrategyAdapter.sol** - Standard interface for all strategies
- **IdleStrategy.sol** - Baseline strategy (holds assets, 0% yield)

### Supporting Contracts

- **MockERC20.sol** - Mock USDC for testing

## Key Features

✅ **ERC-4626 Standard** - Full compliance for maximum composability  
✅ **Modular Strategies** - Plug-and-play strategy adapters  
✅ **Real Integration** - No mocks, no fake yield  
✅ **Pausable** - Emergency pause (except withdrawals)  
✅ **Access Control** - Owner and Operator roles  
✅ **Allocation Caps** - Per-strategy limits  
✅ **Invariant Checks** - Asset conservation guaranteed  

## Critical Invariants

1. **Asset Conservation**: `totalAssets() == sum(strategies) + idle`
2. **Withdrawal Availability**: Withdrawals NEVER blocked (even when paused)
3. **Rebalance Conservation**: Total assets unchanged during rebalance
4. **Share Redemption**: Shares always redeemable for proportional assets

## Development

### Prerequisites

```bash
# Install dependencies (requires Node.js and npm)
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your private key and RPC URLs

```bash
cp .env.example .env
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Mantle Sepolia

```bash
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

## Network Configuration

### Mantle Sepolia Testnet

- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz/
- **Explorer**: https://sepolia.mantlescan.xyz
- **Currency**: MNT

## Security

### Anti-Mock Rules

🚫 **PROHIBITED**:
- Fake yield calculations
- Simulated balances
- Mock protocol interactions
- Time-based yield simulation

✅ **ALLOWED**:
- Idle strategy (0% yield is real)
- Manual rebalancing
- Single strategy for MVP
- Testnet deployment

### Access Control

| Role | Permissions |
|------|-------------|
| **Owner** | Add/remove strategies, set operator, unpause |
| **Operator** | Rebalance, pause |
| **User** | Deposit, withdraw, redeem |

### Pause Mechanism

When paused:
- ❌ Deposits blocked
- ❌ Rebalancing blocked
- ✅ **Withdrawals ALWAYS work**

## Testing

### Unit Tests

- IdleStrategy functionality
- Vault deposit/withdraw flows
- Rebalance mechanism
- Pause functionality
- Access control
- Invariant checks

### Integration Tests

- Full deposit → rebalance → withdraw flow
- Multi-strategy withdrawal
- Strategy failure scenarios
- Emergency pause scenarios

## Deployment

### Deployed Contracts (Mantle Sepolia)

See `deployments/` directory for latest deployment addresses.

### Verification

Verify contracts on Mantle Explorer:

```bash
npx hardhat verify --network mantleSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## License

MIT

## Documentation

For detailed technical documentation, see:
- [Core Technical Thesis](../.memory-bank/docs/principal-engineer/CORE_TECHNICAL_THESIS.md)
- [Solution Architecture](../.memory-bank/docs/solution-architect/SOLUTION_ARCHITECTURE.md)
- [Core Flows](../.memory-bank/docs/solution-architect/CORE_FLOW.md)
