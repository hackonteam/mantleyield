# 🧩 TECH STACK SELECTION — MantleYield

---

## 1️⃣ Smart Contracts (CORE — Mandatory)

### ✅ Solidity (≥0.8.x)

**Rationale**
- Native to Mantle (EVM-compatible)
- Mature and battle-tested tooling
- Familiar to judges and auditors
- Ready-to-use ERC-4626 reference implementations

**Libraries**
- OpenZeppelin (OZ)
- ERC-4626
- AccessControl / Ownable
- Pausable
- SafeERC20

**Design Patterns**
- Immutable core vault
- Strategy adapter interface
- Explicit caps & guard checks

**Tech Lead Verdict**
> Solidity + OpenZeppelin = the lowest bug risk within a short development timeframe.

---

## 2️⃣ Indexing

### ❌ NOT REQUIRED for MVP

**Not used**
- The Graph
- Subgraphs
- Custom indexers

**Instead**
- Read data directly from smart contracts
- Emit basic on-chain events
- Frontend queries data via RPC

**Rationale**
- MVP does not require historical analytics
- Indexing introduces unnecessary operational overhead

---

## 3️⃣ Frontend (Reference Implementation)

### ✅ React + Vite

**Core Functions**
- Deposit / Withdraw
- View vault APY
- View capital allocation

**Explicitly Excluded**
- Fancy UI / visual polish
- Complex charts
- Multi-role dashboards

**Tech Lead View**
> The frontend exists solely to prove that the system works end-to-end.

---

## 4️⃣ Dev / Infrastructure Tooling

### ✅ Hardhat 3
- Deployment scripts (testnet deployment)
- Mantle network configuration

### ✅ Mantlescan (Explorer)
- Verify contracts on testnet  
- Explorer: https://mantlescan.xyz/

---

## 5️⃣ Security / Operations (Hackathon-level)

### ✅ Included
- Multisig (Gnosis Safe)
- Timelock (short delay)
- Pausable mechanisms

### ❌ Not Included
- Full security audit
- Formal verification
- Bug bounty program

**Note**
> These items must be explicitly stated in the submission as **out of scope for the hackathon**.

---

**Principle**
> *Keep the system minimal, real, and verifiable on-chain. Everything else is secondary.*