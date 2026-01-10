# Core Technical Thesis

## Purpose

This is the **most important document** of the MantleYield project. It defines what MantleYield is technically, establishes inviolable invariants, and draws clear boundaries between what can and cannot be simplified.

---

## What is MantleYield (Technically)?

### Technical Identity

**MantleYield is a Composable Yield Router** implemented as:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICAL DEFINITION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ERC-4626 Tokenized Vault                                        │
│      +                                                           │
│  Modular Strategy Adapter System                                 │
│      +                                                           │
│  Operator-Triggered Rebalancing                                  │
│      =                                                           │
│  Capital Routing Infrastructure                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Technical Properties

| Property | Description |
|----------|-------------|
| **Standard Compliance** | Fully ERC-4626 compliant tokenized vault |
| **Composability** | Vault shares usable as collateral elsewhere |
| **Modularity** | Strategies pluggable via uniform interface |
| **Real Integration** | Connects to live DeFi protocols |
| **Transparent** | All operations verifiable on-chain |

### What MantleYield is NOT

| Anti-Pattern | Why Not |
|--------------|---------|
| Yield Farm | No native token emissions |
| APY Simulator | No fake yield calculations |
| Aggregator Frontend | Has real on-chain custody |
| Mock Demo | All operations are real |

---

## Core Invariants

These conditions **MUST NEVER BE VIOLATED**. Any code that breaks these invariants is a critical bug.

### Invariant 1: Asset Conservation

```solidity
// Total assets equals sum of all strategy balances plus idle balance
invariant total_assets_conserved:
    totalAssets() == idleBalance + Σ(strategy[i].totalAssets())
```

**Explanation:** Every token deposited is accounted for. Nothing appears from nowhere, nothing disappears.

---

### Invariant 2: Share Redemption Guarantee

```solidity
// Shares are always redeemable for proportional assets
invariant shares_redeemable:
    ∀ user: withdraw(balanceOf(user)) returns assets ≥ previewRedeem(balanceOf(user)) * 0.9999
```

**Explanation:** Users can always exit with their proportional share. Slippage minimal.

---

### Invariant 3: Withdrawal Availability

```solidity
// Withdrawal never reverts due to system state (only external failures)
invariant withdraw_works:
    ∀ user, amount where amount <= maxWithdraw(user):
        withdraw(amount) succeeds OR external_protocol_reverted
```

**Explanation:** If withdrawal fails, it's due to external protocol failure, never MantleYield logic.

> [!CAUTION]
> **Withdraw MUST always work.** This is a non-negotiable safety property.

---

### Invariant 4: Rebalance Conservation

```solidity
// Rebalancing does not change total assets
invariant rebalance_conserves:
    let before = totalAssets()
    rebalance(from, to, amount)
    assert(totalAssets() == before)
```

**Explanation:** Moving capital between strategies does not create or destroy value.

---

### Invariant 5: No Unauthorized Access

```solidity
// Only designated roles can perform privileged operations
invariant access_control:
    rebalance() callable only by operator OR owner
    pause() callable only by operator OR owner
    addStrategy() callable only by owner
    deposit/withdraw callable by anyone (when not paused)
```

---

### Invariant 6: Pause Safety

```solidity
// Pause blocks risky operations but never blocks exit
invariant pause_safety:
    when paused:
        deposit() → reverts
        rebalance() → reverts
        withdraw() → succeeds  // NEVER BLOCKED
        redeem() → succeeds    // NEVER BLOCKED
```

---

## What MUST NOT Be Faked

These elements are **absolutely prohibited** from simulation or mocking:

### 🚫 PROHIBITED: Fake Yield

```solidity
// ❌ FORBIDDEN - This is never acceptable
function getYield() returns (uint256) {
    return fakeYieldAmount;  // PROHIBITED
}

// ❌ FORBIDDEN - Simulated APY
function getAPY() returns (uint256) {
    return 500; // 5% - FAKE NUMBER - PROHIBITED
}
```

---

### 🚫 PROHIBITED: Mock Balances

```solidity
// ❌ FORBIDDEN
function totalAssets() returns (uint256) {
    return mockedBalance;  // PROHIBITED
}

// ❌ FORBIDDEN - Must read from actual source
function strategyBalance() returns (uint256) {
    return hardcodedValue;  // PROHIBITED
}
```

---

### 🚫 PROHIBITED: Simulated Protocol Calls

```solidity
// ❌ FORBIDDEN - Pretending to interact
function deposit(uint256 amount) external {
    // Does nothing, pretends to deposit
    emit FakeDeposit(amount);  // PROHIBITED
}

// ✅ REQUIRED - Real interaction
function deposit(uint256 amount) external {
    asset.safeTransfer(lendingPool, amount);
    lendingPool.supply(address(asset), amount, address(this), 0);
}
```

---

### 🚫 PROHIBITED: Time-Based Yield Simulation

```solidity
// ❌ FORBIDDEN - Calculating fake yield over time
function getBalance() returns (uint256) {
    uint256 elapsed = block.timestamp - lastUpdate;
    uint256 fakeYield = principal * APY * elapsed / YEAR;
    return principal + fakeYield;  // PROHIBITED
}
```

---

## What CAN Be Simplified (With Control)

These simplifications are **explicitly allowed** for MVP:

### ✅ ALLOWED: Idle Strategy

```solidity
// ✅ ALLOWED - Holding without yield is legitimate
contract IdleStrategy is IStrategyAdapter {
    IERC20 public asset;
    
    function deposit(uint256 amount) external {
        // Just hold the tokens - generates 0% yield
        // This is REAL behavior, not mocking
    }
    
    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this)); // REAL balance
    }
}
```

**Why allowed:** Idle strategy is a valid baseline. It holds real tokens and returns real balances. Zero yield is still real yield.

---

### ✅ ALLOWED: Manual Rebalancing

```solidity
// ✅ ALLOWED - Operator triggers instead of automation
function rebalance(address from, address to, uint256 amount) 
    external 
    onlyOperator 
{
    // Real rebalancing, just manually triggered
}
```

**Why allowed:** The mechanism is identical whether triggered by operator or keeper bot. Both move real tokens.

---

### ✅ ALLOWED: Single Strategy

```solidity
// ✅ ALLOWED - One real strategy is sufficient for MVP
mapping(address => bool) public strategies;
// strategies.length >= 1 is acceptable
```

**Why allowed:** Proves integration works. Adding more is incremental work, not architectural change.

---

### ✅ ALLOWED: Fixed Allocation (No Algorithm)

```solidity
// ✅ ALLOWED - Operator decides allocation, no algorithm
function rebalance(address from, address to, uint256 amount) external {
    // No yield comparison, no optimization
    // Operator manually chose these parameters
}
```

**Why allowed:** Allocation optimization is product feature, not infrastructure proof. Manual decisions are equally valid for demonstrating routing.

---

### ✅ ALLOWED: Testnet Tokens

```solidity
// ✅ ALLOWED - Testnet USDC is acceptable
address public constant USDC = 0x...; // Testnet address
```

**Why allowed:** Testnet tokens behave identically to mainnet. The integration pattern is the same.

---

### ✅ ALLOWED: Minimal Frontend

```
✅ ALLOWED - Basic but functional UI
- Connect wallet
- Show balance
- Deposit button
- Withdraw button
- Transaction status

❌ NOT REQUIRED
- Real-time charts
- Historical performance
- Multiple vaults
- Advanced analytics
```

---

## Simplification Decision Framework

```
┌─────────────────────────────────────────────────────────────────┐
│              IS THIS SIMPLIFICATION ALLOWED?                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Does it involve fake/simulated values?                          │
│  ├── YES → ❌ PROHIBITED                                        │
│  └── NO ↓                                                        │
│                                                                  │
│  Does it break core invariants?                                  │
│  ├── YES → ❌ PROHIBITED                                        │
│  └── NO ↓                                                        │
│                                                                  │
│  Does it still demonstrate real capital routing?                 │
│  ├── YES → ✅ ALLOWED                                           │
│  └── NO → ❌ PROHIBITED                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Thesis Summary

| Element | Status | Notes |
|---------|--------|-------|
| Real token custody | ✅ Required | Vault holds actual ERC-20 |
| Real protocol integration | ✅ Required | At least one |
| Real balance tracking | ✅ Required | From actual sources |
| Real capital movement | ✅ Required | Verifiable on-chain |
| Yield simulation | 🚫 Prohibited | Never acceptable |
| Mock protocols | 🚫 Prohibited | Never acceptable |
| Idle strategy | ✅ Allowed | 0% yield is real |
| Manual trigger | ✅ Allowed | Same mechanism |
| Single strategy | ✅ Allowed | Proves concept |
| Testnet deployment | ✅ Allowed | Same code pattern |

---

## Final Statement

MantleYield is **infrastructure for real capital routing**. Every line of code must serve this purpose. Simplification is acceptable when it reduces scope without compromising integrity. Simulation is never acceptable because it compromises the fundamental thesis.

> [!IMPORTANT]
> **The MVP proves real capital can be routed through a composable vault system. Everything else is secondary.**
