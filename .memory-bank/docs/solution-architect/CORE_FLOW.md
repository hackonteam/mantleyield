# Core Flows

## Purpose

This document describes MantleYield system behavior through detailed flow specifications. Each flow includes happy path, edge cases, and failure handling.

---

## Flow 1: Deposit

### Happy Path

```mermaid
sequenceDiagram
    participant U as User
    participant T as USDC Token
    participant V as Vault
    participant S as Strategy

    U->>T: approve(vault, amount)
    T-->>U: ✓ approved
    
    U->>V: deposit(assets, receiver)
    
    V->>V: Calculate shares = previewDeposit(assets)
    V->>T: transferFrom(user, vault, assets)
    T-->>V: ✓ tokens received
    
    V->>V: _mint(receiver, shares)
    V->>V: Update totalAssets
    
    alt Initial Allocation Enabled
        V->>S: deposit(assets)
        S->>S: Deploy to protocol
    end
    
    V-->>U: emit Deposit(sender, owner, assets, shares)
    V-->>U: return shares
```

### State Changes

| State Variable | Before | After |
|----------------|--------|-------|
| `balanceOf(user)` | 0 | shares |
| `totalSupply` | X | X + shares |
| `totalAssets` | Y | Y + assets |
| USDC in vault/strategy | Z | Z + assets |

### Preconditions

| Check | Condition | Revert Message |
|-------|-----------|----------------|
| Allowance | `token.allowance(user, vault) >= assets` | "ERC20: insufficient allowance" |
| Balance | `token.balanceOf(user) >= assets` | "ERC20: transfer amount exceeds balance" |
| Not Paused | `!paused` | "Pausable: paused" |
| Amount > 0 | `assets > 0` | "Cannot deposit 0" |

### Postconditions

- ✅ User holds vault shares proportional to deposit
- ✅ Vault (or strategy) holds deposited assets
- ✅ `Deposit` event emitted

---

## Flow 2: Withdraw

### Happy Path

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vault
    participant SA as Strategy A
    participant SB as Strategy B
    participant T as USDC Token

    U->>V: withdraw(assets, receiver, owner)
    
    V->>V: shares = previewWithdraw(assets)
    V->>V: Check balanceOf(owner) >= shares
    
    V->>V: Check vault USDC balance
    
    alt Insufficient Vault Liquidity
        V->>SA: withdraw(needed)
        SA->>SA: Withdraw from protocol
        SA-->>V: return USDC
    end
    
    alt Still Insufficient
        V->>SB: withdraw(remaining)
        SB-->>V: return USDC
    end
    
    V->>V: _burn(owner, shares)
    V->>T: transfer(receiver, assets)
    T-->>U: ✓ USDC received
    
    V-->>U: emit Withdraw(sender, receiver, owner, assets, shares)
    V-->>U: return shares
```

### Withdrawal Priority Logic

```
1. Check vault idle balance
2. If insufficient → withdraw from Strategy A
3. If still insufficient → withdraw from Strategy B
4. Continue until sufficient liquidity
5. Transfer to user
```

### State Changes

| State Variable | Before | After |
|----------------|--------|-------|
| `balanceOf(user)` | shares | 0 (if full) |
| `totalSupply` | X | X - shares |
| `totalAssets` | Y | Y - assets |
| User USDC balance | Z | Z + assets |

### Preconditions

| Check | Condition | Revert Message |
|-------|-----------|----------------|
| Shares Available | `balanceOf(owner) >= shares` | "ERC4626: withdraw more than max" |
| Not Paused | `!paused` | "Pausable: paused" |
| Sufficient Liquidity | Strategies can fulfill | "Insufficient liquidity" |

### Postconditions

- ✅ User receives requested assets
- ✅ Vault shares burned
- ✅ `Withdraw` event emitted
- ✅ No loss of user funds

> [!IMPORTANT]
> **Withdraw MUST always work.** If strategies cannot provide liquidity, this is a critical bug.

---

## Flow 3: Rebalance

### Happy Path

```mermaid
sequenceDiagram
    participant OP as Operator
    participant V as Vault
    participant SA as Strategy A
    participant SB as Strategy B

    OP->>V: rebalance(fromStrategy, toStrategy, amount)
    
    V->>V: Check onlyOperator
    V->>V: Check !paused
    V->>V: Validate strategies registered
    V->>V: Check amount <= fromStrategy.totalAssets()
    
    V->>SA: withdraw(amount)
    SA->>SA: Pull from protocol
    SA-->>V: return USDC to vault
    
    V->>V: Verify balance increased
    
    V->>SB: deposit(amount)
    SB->>SB: Deploy to protocol/hold
    
    V->>V: Verify toStrategy.totalAssets increased
    
    V-->>OP: emit Rebalanced(from, to, amount)
```

### Rebalance Types

| Type | From | To | Use Case |
|------|------|-----|----------|
| **Deploy** | Idle | Protocol | Put capital to work |
| **Recall** | Protocol | Idle | Reduce exposure |
| **Shift** | Protocol A | Protocol B | Change allocation |

### State Changes

| State Variable | Before | After |
|----------------|--------|-------|
| `strategyA.totalAssets()` | X | X - amount |
| `strategyB.totalAssets()` | Y | Y + amount |
| `vault.totalAssets()` | Z | Z (unchanged) |

> [!NOTE]
> Total assets MUST remain constant during rebalance. Any change indicates a bug or yield/loss event.

### Preconditions

| Check | Condition | Revert Message |
|-------|-----------|----------------|
| Caller | `msg.sender == operator` | "Not operator" |
| Not Paused | `!paused` | "Pausable: paused" |
| From Registered | `isStrategy[from]` | "Invalid from strategy" |
| To Registered | `isStrategy[to]` | "Invalid to strategy" |
| Sufficient Balance | `from.totalAssets() >= amount` | "Insufficient strategy balance" |
| Allocation Cap | `to.totalAssets() + amount <= cap` | "Exceeds allocation cap" |

### Postconditions

- ✅ Capital moved between strategies
- ✅ Total vault assets unchanged
- ✅ `Rebalanced` event emitted
- ✅ Verifiable on block explorer

---

## Flow 4: Failure Scenarios

### Failure 4.1: Strategy Reverts

```mermaid
sequenceDiagram
    participant OP as Operator
    participant V as Vault
    participant S as Strategy (Failing)

    OP->>V: rebalance(from, to, amount)
    V->>S: withdraw(amount)
    S--xV: REVERT "Protocol error"
    
    Note over V: Transaction reverts atomically
    Note over V: No state changes
    Note over V: No funds lost
    
    V--xOP: REVERT propagated
```

**Handling:**
- Entire transaction reverts
- No partial state changes
- User funds remain safe
- Operator must retry or investigate

---

### Failure 4.2: Rebalance Exceeds Allocation Cap

```mermaid
sequenceDiagram
    participant OP as Operator
    participant V as Vault

    OP->>V: rebalance(from, to, 1000)
    V->>V: Check: to.totalAssets() + 1000 <= cap
    V->>V: 500 + 1000 = 1500 > 1000 cap
    V--xOP: REVERT "Exceeds allocation cap"
    
    Note over V: Guardrail prevents over-concentration
```

**Handling:**
- Transaction reverts before execution
- Operator must reduce amount or raise cap
- Prevents concentration risk

---

### Failure 4.3: Operator Inactive

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vault
    participant S as Strategy

    Note over V: Operator hasn't called rebalance
    Note over S: Capital sits in initial allocation
    
    U->>V: deposit(100) 
    V-->>U: ✓ Shares minted
    
    U->>V: withdraw(100)
    V->>S: withdraw(100)
    S-->>V: return assets
    V-->>U: ✓ Assets returned
    
    Note over V: System still functional
    Note over V: Just not optimized
```

**Handling:**
- System remains fully functional
- Users can deposit/withdraw normally
- Only yield optimization is affected
- No emergency action needed

---

### Failure 4.4: Emergency Pause

```mermaid
sequenceDiagram
    participant OP as Operator
    participant V as Vault
    participant U as User

    Note over V: Security incident detected
    
    OP->>V: pause()
    V-->>OP: emit Paused(operator)
    
    U->>V: deposit(100)
    V--xU: REVERT "Pausable: paused"
    
    OP->>V: rebalance(...)
    V--xOP: REVERT "Pausable: paused"
    
    U->>V: withdraw(50)
    V-->>U: ✓ Assets returned
    
    Note over V: Withdrawals ALWAYS work
    Note over V: Even when paused
```

**Pause Behavior:**

| Function | When Paused |
|----------|-------------|
| `deposit()` | ❌ Blocked |
| `rebalance()` | ❌ Blocked |
| `withdraw()` | ✅ **Always works** |
| `redeem()` | ✅ **Always works** |

> [!CAUTION]
> **Withdrawals must NEVER be paused.** Users must always be able to exit with their funds.

---

### Failure 4.5: Underlying Protocol Failure

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vault
    participant S as Strategy
    participant P as External Protocol

    Note over P: Protocol is exploited/paused
    
    U->>V: withdraw(100)
    V->>S: withdraw(100)
    S->>P: withdraw(100)
    P--xS: REVERT "Protocol paused"
    
    Note over V: Funds stuck in protocol
    Note over V: User cannot withdraw that portion
```

**Handling:**
- This is external risk, not MantleYield bug
- Partial withdrawals from other strategies may work
- Emergency procedures needed
- Trading of vault shares may be alternative exit

**Mitigation:**
- Cap allocation per strategy
- Monitor protocol health
- Maintain idle liquidity buffer

---

## Flow Summary Table

| Flow | Actor | Happy Path Result | Failure Handling |
|------|-------|-------------------|------------------|
| **Deposit** | User | Shares minted, assets deployed | Atomic revert |
| **Withdraw** | User | Assets returned, shares burned | Always works (critical) |
| **Rebalance** | Operator | Capital moved between strategies | Atomic revert |
| **Pause** | Operator | Deposits/rebalance blocked | Withdraw still works |

---

## Invariants

These conditions must **ALWAYS** hold:

```solidity
// Sum of all strategy balances equals totalAssets
assert(totalAssets() == sum(strategies[i].totalAssets()) + idleBalance());

// Shares can always be redeemed for proportional assets
assert(previewRedeem(shares) * totalSupply <= shares * totalAssets);

// Withdraw never fails when user has shares
// (unless external protocol failure)
assert(withdraw(balanceOf(user)) succeeds);

// Rebalance does not change totalAssets
uint256 before = totalAssets();
rebalance(from, to, amount);
assert(totalAssets() == before);
```
