# MantleYield Smart Contracts

> ERC-4626 compliant yield aggregator vault with modular strategy routing on Mantle Network

[![Tests](https://img.shields.io/badge/tests-64%2F64%20passing-brightgreen)](./test)
[![Solidity](https://img.shields.io/badge/solidity-0.8.20-blue)](https://soliditylang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## 📋 Overview

MantleYield is a decentralized yield aggregation protocol built on Mantle Network. It implements the ERC-4626 tokenized vault standard with a modular strategy architecture, allowing users to deposit assets and automatically earn optimized yields across multiple DeFi protocols.

### Key Features

- ✅ **ERC-4626 Compliant**: Standard tokenized vault interface
- ✅ **Modular Strategy System**: Plug-and-play strategy adapters
- ✅ **Capital Efficiency**: Automated rebalancing across strategies
- ✅ **Safety First**: Pausable, access-controlled, and battle-tested
- ✅ **100% Test Coverage**: 64/64 tests passing
- ✅ **Verified Contracts**: All contracts verified on Mantle Sepolia Explorer

---

## 🚀 Deployed Contracts (Mantle Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| **MockUSDC** | `0x33222b6c122d246b09737f66ef35552b966f35cc` | [View Code](https://sepolia.mantlescan.xyz/address/0x33222b6c122d246b09737f66ef35552b966f35cc#code) |
| **MantleYieldVault** | `0x1b103d5cda535797fd810e2489a864d8186700c7` | [View Code](https://sepolia.mantlescan.xyz/address/0x1b103d5cda535797fd810e2489a864d8186700c7#code) |
| **IdleStrategy** | `0xd829efbf50b1d90c7406a3485c66327d931441c1` | [View Code](https://sepolia.mantlescan.xyz/address/0xd829efbf50b1d90c7406a3485c66327d931441c1#code) |

**Network**: Mantle Sepolia (Chain ID: 5003)  
**Deployment Date**: December 21, 2025

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           MantleYieldVault (ERC4626)            │
│  - Deposit/Withdraw                             │
│  - Share Accounting                             │
│  - Strategy Management                          │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│ IdleStrategy   │  │ Future Strategy │
│ (0% yield)     │  │ (Aave, etc.)    │
└────────────────┘  └─────────────────┘
```

### Core Components

1. **MantleYieldVault.sol**: Main ERC-4626 vault contract
   - Manages user deposits and withdrawals
   - Routes capital to strategies
   - Handles share minting/burning
   - Implements access control and pause mechanism

2. **IdleStrategy.sol**: Baseline strategy adapter
   - Holds assets without deploying (0% yield)
   - Serves as liquidity buffer
   - Implements IStrategyAdapter interface

3. **IStrategyAdapter.sol**: Strategy interface
   - Standard interface for all strategies
   - Ensures compatibility and composability

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/hackonteam/mantleyield.git
cd mantleyield/contracts

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Environment Variables

```env
# Mantle Sepolia Testnet
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
MANTLE_SEPOLIA_PRIVATE_KEY=your_private_key_here
MANTLESCAN_API_KEY=your_mantlescan_api_key_here

# Ethereum Sepolia (optional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

---

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/MantleYieldVault.test.ts

# Run tests with coverage
npx hardhat coverage
```

### Test Results

```
✅ IdleStrategy: 20/20 tests passing
✅ MantleYieldVault: 44/44 tests passing
🎉 Total: 64/64 tests passing (100%)
```

---

## 📦 Deployment

### Deploy to Mantle Sepolia

```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network mantleSepolia

# Verify contracts
npx hardhat verify --network mantleSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Deployment Script

The deployment script (`scripts/deploy.ts`) will:
1. Deploy MockUSDC (testnet only)
2. Deploy MantleYieldVault
3. Deploy IdleStrategy
4. Configure vault with strategy
5. Set operator permissions
6. Save deployment info to `deployments/`

---

## 📚 Contract Documentation

### MantleYieldVault

**Key Functions:**
- `deposit(uint256 assets, address receiver)`: Deposit assets and receive shares
- `withdraw(uint256 assets, address receiver, address owner)`: Withdraw assets
- `rebalance(address fromStrategy, address toStrategy, uint256 amount)`: Move funds between strategies
- `addStrategy(address strategy, uint256 cap)`: Add new strategy (owner only)
- `pause()` / `unpause()`: Emergency controls (operator only)

### IdleStrategy

**Key Functions:**
- `deposit(uint256 amount)`: Receive assets from vault
- `withdraw(uint256 amount)`: Return assets to vault
- `totalAssets()`: Query strategy balance
- `emergencyWithdraw()`: Emergency asset recovery (owner only)

---

## 🔒 Security

### Audit Status
⚠️ **Not yet audited** - This is a hackathon project. DO NOT use in production without a professional audit.

### Security Features
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Pausable mechanism for emergency stops
- ✅ Access control (Owner, Operator roles)
- ✅ Strategy caps to limit exposure
- ✅ Comprehensive test coverage

### Known Limitations
- IdleStrategy provides 0% yield (baseline only)
- No slippage protection on rebalancing
- Single asset support (USDC only)

---

## 👥 Team

### Core Development Team

#### 1. **Bernie Nguyen** ([@BernieIO](mailto:bernie.web3@gmail.com))
**Leader of HackOn Team**
- 🎯 Project Owner, Lead Engineer & Architect
- 💻 Developed all smart contracts
- 👨‍💼 Supervised and supported developers and BD throughout the hackathon
- 📧 Email: bernie.web3@gmail.com

#### 2. **Cảnh Trịnh** ([@canhtrinh850](mailto:canhtrinh850@gmail.com))
**Infrastructure Developer**
- 🧪 Developed comprehensive unit tests (64/64 tests)
- ⚙️ Configured Mantle Sepolia network settings
- 🚀 Deployed and verified smart contracts
- 📧 Email: canhtrinh850@gmail.com

### Frontend & Business Team

#### 3. **Thien Vo** ([@hongthienn280706](mailto:hongthienn280706@gmail.com))
**Frontend Developer & UI/UX Designer**
- 🎨 Designing user interface
- ⚛️ Building frontend application
- 📧 Email: hongthienn280706@gmail.com

#### 4. **Hieu Tran** ([@idoltranbaohieu](mailto:idoltranbaohieu@gmail.com))
**Business Developer**
- 📊 Business development and strategy
- 🤝 Partnership and community building
- 📧 Email: idoltranbaohieu@gmail.com

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Smart contract development
- [x] Comprehensive testing
- [x] Deployment to Mantle Sepolia
- [x] Contract verification

### Phase 2: Integration 🚧 (In Progress)
- [ ] Frontend development
- [ ] Wallet integration
- [ ] User dashboard

### Phase 3: Expansion 📋 (Planned)
- [ ] Additional strategies (Aave, Compound)
- [ ] Multi-asset support
- [ ] Mainnet deployment
- [ ] Security audit

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🔗 Links

- **Website**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **Twitter**: [Coming Soon]
- **Discord**: [Coming Soon]

### Mantle Network Resources
- **Mantle Docs**: https://docs.mantle.xyz/
- **Mantle Sepolia Faucet**: https://faucet.sepolia.mantle.xyz/
- **Mantle Sepolia Explorer**: https://sepolia.mantlescan.xyz/

---

## 🙏 Acknowledgments

- **Mantle Network** for providing the infrastructure and hackathon opportunity
- **OpenZeppelin** for secure smart contract libraries
- **Hardhat** for the development framework
- **Viem** for the TypeScript Ethereum library

---

## 📞 Contact

For questions, suggestions, or collaboration opportunities:

- **Project Lead**: Bernie Nguyen - bernie.web3@gmail.com
- **Infrastructure**: Cảnh Trịnh - canhtrinh850@gmail.com

---

<div align="center">

**Built with ❤️ by HackOn Team for Mantle Network**

[Report Bug](https://github.com/hackonteam/mantleyield/issues) · [Request Feature](https://github.com/hackonteam/mantleyield/issues)

</div>
