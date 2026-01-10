# Architecture Decisions

## Purpose

This document records key architectural decisions for MantleYield. Each decision follows the ADR (Architecture Decision Record) format and should not be reversed without careful consideration.

---

## ADR-001: ERC-4626 Standard Vault

### Status
**ACCEPTED**

### Context
MantleYield needs a vault mechanism for user deposits. Options considered:
1. Custom vault implementation
2. ERC-4626 Tokenized Vault Standard

### Decision
**Use ERC-4626 standard for the vault implementation.**

### Rationale

| Factor | ERC-4626 | Custom |
|--------|----------|--------|
| Composability | ✅ Native integration with other protocols | ❌ Requires adapters |
| Standardization | ✅ Well-defined interface | ❌ Custom ABI |
| Tooling | ✅ Wallet/aggregator support | ❌ Limited |
| Auditing | ✅ Well-understood pattern | ❌ Higher risk |
| Development time | ✅ OpenZeppelin base | ❌ From scratch |

### Consequences

**Benefits:**
- Vault shares automatically usable as collateral
- Standard previewDeposit/previewWithdraw
- Integrators can use without custom code

**Trade-offs:**
- Must conform to ERC-4626 interface
- Some flexibility sacrificed for standardization

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Yearn-style custom vault | Adds complexity, reduces compatibility |
| Simple transfer-in/out | No share tokenization |
| ERC-1155 multi-vault | Overkill for MVP |

---

## ADR-002: Modular Strategy Architecture

### Status
**ACCEPTED**

### Context
The vault needs to deploy capital to yield sources. Options considered:
1. Monolithic vault with hardcoded protocols
2. Modular strategy adapters with common interface

### Decision
**Use modular strategy adapter pattern with IStrategyAdapter interface.**

### Rationale

```
Monolithic                          Modular
┌──────────────────┐               ┌──────────────────┐
│  Vault           │               │  Vault           │
│  ┌────────────┐  │               │                  │
│  │ ProtocolA  │  │               └────────┬─────────┘
│  │ integration│  │                        │
│  └────────────┘  │               ┌────────▼─────────┐
│  ┌────────────┐  │               │  IStrategyAdapter│
│  │ ProtocolB  │  │               └────────┬─────────┘
│  │ integration│  │                   ┌────┴────┐
│  └────────────┘  │               ┌───▼──┐  ┌──▼───┐
└──────────────────┘               │Strat A│  │Strat B│
                                   └───────┘  └───────┘
```

| Factor | Modular | Monolithic |
|--------|---------|------------|
| Add new strategy | ✅ Deploy adapter only | ❌ Redeploy vault |
| Testing | ✅ Isolated unit tests | ❌ Integration only |
| Maintenance | ✅ Update one adapter | ❌ Full upgrade |
| Flexibility | ✅ Mix and match | ❌ Fixed set |

### Consequences

**Benefits:**
- New protocols added without vault changes
- Each adapter independently testable
- Clear separation of concerns
- Future-proofing for RWA integrations

**Trade-offs:**
- Slightly higher gas for adapter calls
- More contracts to deploy
- Interface must be carefully designed

---

## ADR-003: No Upgradeability (Immutable Contracts)

### Status
**ACCEPTED**

### Context
Should contracts be upgradeable via proxy pattern?

### Decision
**Deploy immutable contracts for MVP. No proxy pattern.**

### Rationale

| Factor | Immutable | Upgradeable |
|--------|-----------|-------------|
| Trust model | ✅ Code is law | ❌ Admin can change |
| Audit scope | ✅ Fixed scope | ❌ Must audit upgrade paths |
| Complexity | ✅ Simple | ❌ Storage layout risks |
| Hackathon fit | ✅ Less time | ❌ More development |
| MVP risk | ✅ No admin key risk | ❌ Admin key is attack vector |

### Consequences

**Benefits:**
- Reduced attack surface
- No governance/admin key risks
- Simpler codebase
- Users can verify exact code

**Trade-offs:**
- Bug fixes require migration
- Cannot add features to deployed vault
- May need new deployment for improvements

### Migration Strategy (if needed)
1. Deploy new vault version
2. Users withdraw from old vault
3. Users deposit to new vault
4. Or: Implement share migration function in new vault

---

## ADR-004: Push Rebalancing (Operator-Triggered)

### Status
**ACCEPTED**

### Context
How should capital reallocation be triggered?
1. **Push (Operator calls):** Operator decides when/what to rebalance
2. **Pull (On-demand):** Rebalance when accessed
3. **Automated (Keeper):** Bot triggers based on conditions

### Decision
**Use push rebalancing with operator trigger for MVP.**

### Rationale

```
Push Model (Chosen)
┌──────────┐     ┌────────┐     ┌────────────┐
│ Operator │────▶│ Vault  │────▶│ Strategies │
│ (EOA)    │     │rebalance│    │            │
└──────────┘     └────────┘     └────────────┘
                      │
                 Explicit tx
```

| Factor | Push | Pull | Automated |
|--------|------|------|-----------|
| Complexity | ✅ Simple | ❌ Complex | ❌ Complex |
| Gas cost | User pays specific tx | User pays on access | Bot pays |
| Control | ✅ Operator decides | ❌ Implicit | ❌ Rules-based |
| MVP fit | ✅ Quick to build | ❌ More logic | ❌ Keeper infra |
| Transparency | ✅ Clear tx | ❌ Hidden in deposits | ✅ Clear |

### Consequences

**Benefits:**
- Full control over timing
- Simple implementation
- No keeper infrastructure needed
- Clear audit trail

**Trade-offs:**
- Requires active operator
- No automatic optimization
- Manual process for hackathon

### Future Evolution
Can add keeper automation later:
```solidity
// Future: Add keeper role
function automatedRebalance() external onlyKeeper {
    // Threshold-based trigger
    if (shouldRebalance()) {
        rebalance(from, to, amount);
    }
}
```

---

## ADR-005: Pausable with Withdraw Exception

### Status
**ACCEPTED**

### Context
Emergency pause mechanism is standard for DeFi. What should be pausable?

### Decision
**Implement pause that blocks deposits and rebalance, but NEVER blocks withdrawals.**

### Rationale

| Function | When Paused | Rationale |
|----------|-------------|-----------|
| deposit() | ❌ Blocked | Prevent more exposure |
| rebalance() | ❌ Blocked | Prevent further changes |
| withdraw() | ✅ Always works | User exit right |
| redeem() | ✅ Always works | User exit right |

> [!CAUTION]
> **User exit must NEVER be blocked.** This is a fundamental safety property.

### Consequences

**Benefits:**
- Users can always exit
- Limits damage during incidents
- Builds user trust
- Aligns with DeFi best practices

**Trade-offs:**
- Attacker could drain during pause if exploit allows withdrawals
- Mitigation: Pause stops new deposits, existing users exit with assets

---

## ADR-006: Single Asset Type (USDC)

### Status
**ACCEPTED**

### Context
Should the vault support multiple deposit assets?

### Decision
**MVP supports single asset type (USDC or testnet equivalent).**

### Rationale

| Factor | Single Asset | Multi-Asset |
|--------|--------------|-------------|
| Complexity | ✅ Simple | ❌ Complex |
| Testing | ✅ One path | ❌ Many paths |
| Accounting | ✅ Straightforward | ❌ Oracle dependencies |
| MVP scope | ✅ Sufficient | ❌ Scope creep |

### Consequences

**Benefits:**
- Simpler share calculation
- No oracle needed
- Clear accounting
- Focused testing

**Trade-offs:**
- Limited to stablecoin users
- Future multi-asset requires new vault

---

## Decision Summary

| ADR | Decision | Reversibility |
|-----|----------|---------------|
| 001 | ERC-4626 Standard | 🔴 Cannot change deployed vault |
| 002 | Modular Strategies | 🟡 Can add/remove strategies |
| 003 | Immutable Contracts | 🟡 New deployment if needed |
| 004 | Push Rebalancing | 🟢 Can add automation later |
| 005 | Pausable (except withdraw) | 🔴 Core safety property |
| 006 | Single Asset | 🟡 New vault for new assets |

---

## Decision Log

| Date | ADR | Status | Author |
|------|-----|--------|--------|
| 2024-XX | ADR-001 | Accepted | Core Team |
| 2024-XX | ADR-002 | Accepted | Core Team |
| 2024-XX | ADR-003 | Accepted | Core Team |
| 2024-XX | ADR-004 | Accepted | Core Team |
| 2024-XX | ADR-005 | Accepted | Core Team |
| 2024-XX | ADR-006 | Accepted | Core Team |
