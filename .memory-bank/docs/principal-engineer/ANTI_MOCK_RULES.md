# Anti-Mock Rules

## Purpose

This document protects the technical ethics of MantleYield by defining prohibited patterns, allowed simplifications, and criteria for "simplified but real" implementations.

---

## Core Principle

> **Real but simple beats complex but fake.**

A working integration with one protocol is infinitely more valuable than a mock integration with ten pretend protocols.

---

## Prohibited Patterns

### 🚫 PATTERN 1: Hardcoded Yield

```solidity
// ❌ ABSOLUTELY PROHIBITED
contract FakeStrategy {
    uint256 constant FAKE_APY = 500; // 5% - FORBIDDEN
    uint256 public lastUpdate;
    uint256 public fakeBalance;
    
    function totalAssets() external view returns (uint256) {
        // Simulates yield - FORBIDDEN
        uint256 elapsed = block.timestamp - lastUpdate;
        uint256 yield = fakeBalance * FAKE_APY * elapsed / (365 days * 10000);
        return fakeBalance + yield;
    }
}
```

**Why prohibited:** Creates illusion of working system, proves nothing about real integration.

---

### 🚫 PATTERN 2: Mock Protocol Calls

```solidity
// ❌ ABSOLUTELY PROHIBITED
contract MockLendingAdapter {
    function deposit(uint256 amount) external {
        // Does nothing - FORBIDDEN
        emit FakeDeposit(amount);
    }
    
    function withdraw(uint256 amount) external returns (uint256) {
        // Returns fake value - FORBIDDEN
        return amount;
    }
}
```

**Why prohibited:** Pretends to interact with protocols without actual interaction.

---

### 🚫 PATTERN 3: Fake Balance Tracking

```solidity
// ❌ ABSOLUTELY PROHIBITED
contract MockStrategy {
    uint256 private _mockBalance;
    
    function deposit(uint256 amount) external {
        _mockBalance += amount;  // Just counter, no tokens - FORBIDDEN
    }
    
    function totalAssets() external view returns (uint256) {
        return _mockBalance;  // Not reading real tokens - FORBIDDEN
    }
}
```

**Why prohibited:** Balance not backed by actual tokens.

---

### 🚫 PATTERN 4: Time-Based Simulation

```solidity
// ❌ ABSOLUTELY PROHIBITED
function getBalance() returns (uint256) {
    uint256 timePassed = block.timestamp - startTime;
    uint256 simulatedGrowth = principal * timePassed * rate / YEAR;
    return principal + simulatedGrowth;  // FORBIDDEN
}
```

**Why prohibited:** Creates artificial growth not backed by real yield.

---

### 🚫 PATTERN 5: Hardcoded Responses

```solidity
// ❌ ABSOLUTELY PROHIBITED
function getAPY() external pure returns (uint256) {
    return 800;  // 8% - hardcoded lie - FORBIDDEN
}

function getPricePerShare() external pure returns (uint256) {
    return 1.05e18;  // Fake appreciation - FORBIDDEN
}
```

**Why prohibited:** Returns values not derived from real state.

---

### 🚫 PATTERN 6: Event-Only Operations

```solidity
// ❌ ABSOLUTELY PROHIBITED
function rebalance(address from, address to, uint256 amount) external {
    // Does nothing except emit event - FORBIDDEN
    emit Rebalanced(from, to, amount);
}
```

**Why prohibited:** Creates audit trail for operations that never happened.

---

## Detection Checklist

Use this checklist to identify mock patterns:

| Question | If Yes |
|----------|--------|
| Does `totalAssets()` read from actual token balances? | ✅ Real |
| Does `deposit()` transfer real tokens? | ✅ Real |
| Does `withdraw()` return real tokens? | ✅ Real |
| Is APY calculated from actual rate changes? | ✅ Real |
| Does strategy interact with external protocol? | ✅ Real |
| Are balances backed by actual tokens? | ✅ Real |

---

## Allowed Simplifications

### ✅ ALLOWED 1: Idle Strategy (Zero Yield)

```solidity
// ✅ ALLOWED - This is real behavior, not mocking
contract IdleStrategy is IStrategyAdapter {
    IERC20 public immutable asset;
    
    function deposit(uint256 amount) external {
        // Tokens ARE transferred to this contract
        asset.safeTransferFrom(msg.sender, address(this), amount);
        // Just held, not deployed - this is REAL
    }
    
    function withdraw(uint256 amount) external returns (uint256) {
        // Returns REAL tokens
        asset.safeTransfer(msg.sender, amount);
        return amount;
    }
    
    function totalAssets() external view returns (uint256) {
        // Returns REAL balance
        return asset.balanceOf(address(this));
    }
}
```

**Why allowed:** Holds and returns real tokens. Zero yield is still real yield.

---

### ✅ ALLOWED 2: Single Protocol Integration

```solidity
// ✅ ALLOWED - One real integration is sufficient
// Only integrating with Lendle, not Lendle + Compound + AAVE
contract LendleAdapter is IStrategyAdapter {
    ILendingPool public immutable lendingPool;
    
    function deposit(uint256 amount) external {
        asset.approve(address(lendingPool), amount);
        lendingPool.supply(address(asset), amount, address(this), 0);
    }
    
    function totalAssets() external view returns (uint256) {
        return aToken.balanceOf(address(this));  // REAL balance
    }
}
```

**Why allowed:** Proves real integration works. More protocols are incremental, not fundamental.

---

### ✅ ALLOWED 3: Manual Trigger Instead of Automation

```solidity
// ✅ ALLOWED - Manual is same mechanism, just different trigger
function rebalance(address from, address to, uint256 amount) external onlyOperator {
    // Same code whether triggered by operator or keeper bot
    IStrategyAdapter(from).withdraw(amount);
    IStrategyAdapter(to).deposit(amount);
    emit Rebalanced(from, to, amount);
}
```

**Why allowed:** Automation is convenience, not correctness.

---

### ✅ ALLOWED 4: Testnet Deployment

```solidity
// ✅ ALLOWED - Testnet tokens behave identically
address constant USDC = 0x1234...;  // Mantle Sepolia USDC
```

**Why allowed:** Same code, same behavior, different network.

---

### ✅ ALLOWED 5: Fixed Allocation (No Algorithm)

```solidity
// ✅ ALLOWED - Operator chooses allocation, no optimization algorithm
function rebalance(address from, address to, uint256 amount) external onlyOperator {
    // Operator manually determined these parameters
    // No APY comparison, no optimization
    // Still moves REAL tokens
}
```

**Why allowed:** Allocation logic is product optimization, not infrastructure proof.

---

### ✅ ALLOWED 6: No Historical Data

```javascript
// ✅ ALLOWED - Display current state only
const currentBalance = await vault.totalAssets();
display(currentBalance);

// No historical charts required
// This is display simplification, not data mocking
```

**Why allowed:** Historical data is convenience, current state is truth.

---

## "Simplified but Real" Criteria

A implementation qualifies as "simplified but real" if it passes all checks:

```
┌─────────────────────────────────────────────────────────────────┐
│              SIMPLIFIED BUT REAL CHECKLIST                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Real tokens move between contracts                            │
│  □ Balances derived from actual token.balanceOf()                │
│  □ External protocol calls happen (if strategy claims to)        │
│  □ State changes verifiable on block explorer                    │
│  □ No time-based or fixed yield simulation                       │
│  □ No hardcoded return values for dynamic data                   │
│                                                                  │
│  If ALL checked → ✅ Simplified but Real                         │
│  If ANY unchecked → ❌ Mock / Fake                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison Table

| Feature | Mock Pattern | Simplified Real |
|---------|--------------|-----------------|
| Token transfers | ❌ None/fake | ✅ Real transfers |
| Balance source | ❌ Internal counter | ✅ token.balanceOf() |
| Protocol interaction | ❌ None | ✅ At least one real |
| APY/Yield | ❌ Hardcoded | ✅ Derived from actual data (or not shown) |
| State changes | ❌ Only events | ✅ Verifiable on-chain |
| Rebalance | ❌ Fake movement | ✅ Real token transfers |

---

## Code Review Gate

Before merging any code, verify:

### For Strategy Adapters

- [ ] `deposit()` calls `safeTransferFrom` or equivalent
- [ ] `withdraw()` calls `safeTransfer` or equivalent
- [ ] `totalAssets()` calls real balance check
- [ ] External protocol calls actually happen

### For Vault

- [ ] `deposit()` mints shares based on real asset transfer
- [ ] `withdraw()` burns shares and returns real assets
- [ ] `totalAssets()` aggregates from real sources
- [ ] `rebalance()` moves real tokens

### For Frontend

- [ ] Displays data from on-chain reads
- [ ] No hardcoded APY or growth
- [ ] Transaction status from actual transaction

---

## Enforcement

| Role | Responsibility |
|------|---------------|
| **PM** | Reject any task showing mock patterns |
| **Dev** | Flag any request for simulation code |
| **Reviewer** | Block PRs with prohibited patterns |
| **QA** | Verify on-chain state matches expected |

> [!CAUTION]
> **Any mock pattern discovered post-deployment destroys project credibility. There is no recovery from this.**

---

## Summary

| Status | Pattern |
|--------|---------|
| 🚫 **PROHIBITED** | Fake yield, mock calls, simulated balances |
| ✅ **ALLOWED** | Idle strategy, single protocol, manual trigger, testnet |
| ✅ **CRITERION** | Real tokens, real balances, verifiable on-chain |
