# On-Chain Boundary

## Purpose

This document defines the critical boundary between on-chain and off-chain responsibilities. It clarifies what MUST be on-chain (custody, accounting, authority) and what is explicitly NOT an on-chain responsibility.

---

## The Fundamental Principle

> **On-chain = Trust-critical. Off-chain = Convenience.**

Anything that involves user funds, ownership, or irreversible state changes MUST be on-chain. Everything else is optional infrastructure.

---

## On-Chain Responsibilities

### 1. Asset Custody

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTODY BOUNDARY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ON-CHAIN (MantleYield contracts)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Vault holds deposited ERC-20 tokens                  │   │
│  │  ✅ Strategies hold deployed tokens                      │   │
│  │  ✅ All token transfers via smart contracts              │   │
│  │  ✅ Custody verified by token.balanceOf()                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OFF-CHAIN                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ❌ No off-chain wallets holding user funds              │   │
│  │  ❌ No custodial backend servers                         │   │
│  │  ❌ No multi-sig for routine operations                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Custody Implementation

```solidity
// All deposits go directly to vault contract
function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
    // Tokens transferred FROM user TO vault (on-chain)
    asset.safeTransferFrom(msg.sender, address(this), assets);
    
    // Vault is now custodian
    shares = previewDeposit(assets);
    _mint(receiver, shares);
}

// Strategy adapters hold tokens for deployed capital
function strategyDeposit(uint256 amount) external {
    // Tokens transferred FROM vault TO strategy (on-chain)
    asset.safeTransfer(address(strategy), amount);
    strategy.deposit(amount);
}
```

---

### 2. Accounting

```
┌─────────────────────────────────────────────────────────────────┐
│                      ACCOUNTING BOUNDARY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ON-CHAIN (Smart Contract State)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Share balances (balanceOf mapping)                   │   │
│  │  ✅ Total supply of shares                               │   │
│  │  ✅ Total assets under management                        │   │
│  │  ✅ Strategy allocations                                 │   │
│  │  ✅ All balance changes via transactions                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OFF-CHAIN (Display Only)                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 Historical balance charts                            │   │
│  │  📊 APY calculations                                     │   │
│  │  📊 Performance analytics                                │   │
│  │  📊 UI display of on-chain data                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Accounting Implementation

```solidity
// Primary accounting: share balances (ERC-20 standard)
mapping(address => uint256) private _balances;
uint256 private _totalSupply;

// Secondary accounting: total assets
function totalAssets() public view returns (uint256) {
    uint256 total = asset.balanceOf(address(this)); // Idle
    for (uint i = 0; i < strategies.length; i++) {
        total += strategies[i].totalAssets(); // Deployed
    }
    return total;
}

// All accounting changes happen through transactions
function _mint(address account, uint256 amount) internal {
    _totalSupply += amount;
    _balances[account] += amount;
    emit Transfer(address(0), account, amount);
}
```

---

### 3. Authority (Access Control)

```
┌─────────────────────────────────────────────────────────────────┐
│                       AUTHORITY BOUNDARY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ON-CHAIN (Enforced by Smart Contracts)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Owner role (deploy-time, can transfer)               │   │
│  │  ✅ Operator role (can trigger rebalance)                │   │
│  │  ✅ User permissions (deposit/withdraw own funds)        │   │
│  │  ✅ Pause mechanism (emergency stop)                     │   │
│  │  ✅ All permission checks via require/modifier           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OFF-CHAIN                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ❌ No backend authorization checks                      │   │
│  │  ❌ No API keys or tokens                                │   │
│  │  ❌ No centralized permission database                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Authority Implementation

```solidity
// Role definitions
address public owner;
address public operator;

// Modifiers enforce authority
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

modifier onlyOperator() {
    require(msg.sender == operator || msg.sender == owner, "Not operator");
    _;
}

// Permission-gated functions
function addStrategy(address strategy) external onlyOwner { ... }
function rebalance(...) external onlyOperator { ... }
function pause() external onlyOperator { ... }

// User functions - no special permissions needed
function deposit(...) external whenNotPaused { ... }
function withdraw(...) external { ... }  // Never paused
```

---

## Explicit Non-Responsibilities (Off-Chain)

These are **NOT** on-chain concerns:

### 1. Yield Display / APY Calculation

| Item | Location | Reason |
|------|----------|--------|
| Current APY | Off-chain | Calculated from rate changes |
| Historical yield | Off-chain | Requires indexing |
| Projected returns | Off-chain | Not critical data |
| Comparison charts | Off-chain | UI convenience |

```javascript
// Off-chain APY calculation (frontend/backend)
function calculateAPY(vault) {
    const currentAssets = await vault.totalAssets();
    const previousAssets = await getHistoricalAssets(vault, '24h ago');
    const apy = (currentAssets / previousAssets - 1) * 365;
    return apy;
}
```

---

### 2. Rebalance Scheduling

| Item | Location | Reason |
|------|----------|--------|
| When to rebalance | Off-chain | Operator decision |
| Optimal allocation | Off-chain | Algorithm, not custody |
| Keeper triggers | Off-chain | Automation convenience |

> [!NOTE]
> The rebalance **execution** is on-chain. Only the **decision** of when/how to rebalance is off-chain.

---

### 3. User Interface

| Item | Location | Reason |
|------|----------|--------|
| Wallet connection | Off-chain | Web3 library |
| Transaction building | Off-chain | Then submitted on-chain |
| Balance display | Off-chain reads on-chain | Display only |
| Error messages | Off-chain | UX enhancement |

---

### 4. Analytics / Indexing

| Item | Location | Reason |
|------|----------|--------|
| Historical transactions | Off-chain (indexer) | Not needed for operation |
| Event aggregation | Off-chain (The Graph) | Convenience |
| Portfolio tracking | Off-chain | Cross-protocol data |

---

## Boundary Decision Matrix

| Question | On-Chain | Off-Chain |
|----------|----------|-----------|
| Can user lose funds if this fails? | ✅ | |
| Is this the source of truth? | ✅ | |
| Does this require trustlessness? | ✅ | |
| Is this display/convenience only? | | ✅ |
| Can this be recalculated from on-chain data? | | ✅ |
| Is latency acceptable? | | ✅ |

---

## Security Implications

### On-Chain Security Requirements

| Component | Security Measure |
|-----------|-----------------|
| Custody | Reentrancy guards, CEI pattern |
| Accounting | Overflow protection (Solidity 0.8+) |
| Authority | Access control modifiers |
| Funds | Pause mechanism, withdrawal always works |

### Off-Chain Security Considerations

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| Frontend | Low (display only) | No private keys |
| Indexer | Low (read-only) | Can be rebuilt |
| Keeper | Medium (triggers tx) | Timelock if automated |

---

## Implementation Checklist

### On-Chain Must Have

- [x] Token custody in vault contract
- [x] Share accounting via ERC-4626
- [x] Strategy balance tracking
- [x] Owner/Operator access control
- [x] Pause mechanism (except withdraw)
- [x] Event emission for all state changes

### Off-Chain Nice to Have

- [ ] APY display (from on-chain reads)
- [ ] Historical charts (from events)
- [ ] Keeper automation
- [ ] Analytics dashboard

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSIBILITY SUMMARY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ON-CHAIN: Custody + Accounting + Authority                      │
│  ════════════════════════════════════════                        │
│  • Hold user funds                                               │
│  • Track balances                                                │
│  • Enforce permissions                                           │
│  • Execute state changes                                         │
│  • Emit events                                                   │
│                                                                  │
│  OFF-CHAIN: Everything Else                                      │
│  ══════════════════════════                                      │
│  • Display data                                                  │
│  • Calculate analytics                                           │
│  • Trigger transactions                                          │
│  • User interface                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
