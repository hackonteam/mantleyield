# **MantleYield – Composable Yield Router for DeFi & RWA on Mantle**

### **Track: DeFi & Composability**

**Keywords:** Lending protocols · Collateral strategies · Yield optimization · RWA-ready · ERC-4626

---

## **🧠 Problem**

Despite rapid growth of DeFi on Mantle, **capital efficiency remains low**.

* Liquidity is fragmented across lending protocols, DEX LPs, and emerging RWA pools

* Users must manually monitor APYs and rebalance funds

* Capital often stays in **suboptimal strategies**, reducing yield and ecosystem efficiency

Existing solutions are **single-protocol focused** and do not fully leverage Mantle’s low-gas, high-throughput environment.

---

## **💡 Solution**

**MantleYield** is a **composable, automated yield optimizer** that routes capital across multiple DeFi and RWA-backed strategies on Mantle to maximize risk-adjusted yield.

It acts as a **capital efficiency layer** for Mantle, enabling users and protocols to deploy liquidity once and let the system optimize returns automatically.

---

## **⚙️ How It Works**

### **1️⃣ ERC-4626 Yield Vault (Core Primitive)**

* Users deposit stablecoins (e.g. USDC)

* Receive ERC-4626 vault shares

* Vault abstracts all underlying strategies

This makes MantleYield **fully composable** with other DeFi protocols.

---

### **2️⃣ Modular Yield Strategies**

MantleYield integrates multiple yield sources as **plug-in strategies**, including:

* **Lending protocols** (AAVE-style money markets)

* **DEX liquidity pools** (Uniswap V3-style LP positions)

* **RWA-backed yield pools** (synthetic yield tokens, treasury/RWA pools when available)

Each strategy exposes real-time metrics:

* APY

* Utilization

* Risk parameters

---

### **3️⃣ Automated Rebalancing Engine**

An on-chain/off-chain keeper system continuously:

* Monitors yield across strategies

* Compares net returns (after gas \+ risk buffers)

* Reallocates capital to the most efficient strategies

Rebalancing transactions are **fully on-chain and transparent**.

---

### **4️⃣ RWA-Ready & Synthetic Yield Support**

MantleYield is designed to support:

* **Synthetic assets backed by RWA** (e.g. treasury yield tokens, real-world income pools)

* These assets are treated as **first-class strategies** inside the vault

* Enables RWA yield to flow directly into DeFi composability

No off-chain custody or legal assumptions are required for the MVP.

---

## **🧩 Why MantleYield is Highly Composable**

* **ERC-4626 standard** → easily integrated by wallets, protocols, and aggregators

* Strategy-based architecture → new lending/RWA pools can be added without redeploying the vault

* Vault shares can be:

  * Used as collateral

  * Integrated into structured products

  * Combined with other DeFi primitives

MantleYield is not just a dApp — it is **yield infrastructure**.

---

## **🏆 Fit with DeFi & Composability Judging Criteria**

### **✅ Lending Protocols**

* Integrates AAVE-like lending markets as core strategies

* Automatically routes capital based on utilization and APY

### **✅ Collateral Strategies**

* ERC-4626 vault shares can be used as collateral in external protocols

* Underlying assets remain productive while composable

### **✅ Composable Yield Optimizers**

* Multi-strategy, protocol-agnostic optimizer

* Capital efficiency layer rather than a single yield source

### **✅ Synthetic Assets Backed by RWA**

* Architecture supports synthetic RWA-backed yield tokens

* Bridges real-world yield into DeFi without breaking composability

---

## **🛠️ Technical Architecture**

* **Smart Contracts:** Solidity

  * ERC-4626 Vault

  * Strategy adapters

  * Rebalance logic

* **Automation:** Keeper bots (time- or threshold-based)

* **Data:** Mantle RPC for on-chain yield metrics

* **Frontend:** React dashboard (APY, allocation, vault performance)

All components are deployed and demonstrated on **Mantle testnet**.

---

## **🚀 Why MantleYield Matters for Mantle**

* Mantle’s **low gas fees** enable frequent, cost-efficient rebalancing

* Aligns with Mantle’s focus on:

  * Capital efficiency

  * DeFi × RWA composability

* Provides foundational infrastructure for future RWA liquidity on Mantle

**MantleYield turns fragmented yield into a unified, composable capital layer for Mantle.**

---

## **🔮 Post-Hackathon Vision (Optional)**

* Risk-weighted strategy allocation

* Permissionless strategy marketplace

* Native integration with Mantle RWA protocols

* Institutional-grade vaults

---

# **PM-READY DOCUMENT**

## **MANTLEYIELD – COMPOSABLE YIELD ROUTER (14-DAY MVP)**

---

## **1️⃣ SYSTEM OVERVIEW (1–2 pages)**

### **1.1. System Objective**

MantleYield is a **Composable Yield Router** on **Mantle Network**, designed as an **infrastructure-grade DeFi primitive**, **not** a yield farming dApp.

The system enables:

* Users to deposit assets (ERC-20 stablecoins) into an **ERC-4626 Vault**

* The Vault to deploy capital into **real DeFi protocols** via strategies

* Capital to be **reallocated / rebalanced** between strategies

* ERC-4626 vault shares to remain **fully composable** with other DeFi protocols

⚠️ **The MVP is NOT designed to optimize APY**, but to prove that:

* Capital routing is **real**

* Integrations are **real**

* The architecture is **correct and extensible**

---

### **1.2. Target Users (MVP)**

**Primary**

* DeFi & Composability judges

* DeFi builders / protocol integrators

**Secondary**

* End users (demo purposes only: deposit / withdraw)

---

### **1.3. MVP Scope (UPDATED – NO MOCKING)**

The MVP includes:

* **01 ERC-4626 Vault** (real implementation)

* **At least 01 Strategy Adapter** integrated with a **real DeFi protocol** on Mantle

* **01 additional Strategy Adapter**, which can be:

  * A second real DeFi protocol, **OR**

  * An **Idle Strategy** (capital remains in vault, no yield)

* **Manual rebalance** (operator-triggered) → **real capital movement**

* Minimal frontend to demonstrate **end-to-end flow**

The MVP explicitly **does NOT include**:

* Yield simulation

* Fake APY

* Mock protocols

---

### **1.4. Architectural Principles (PM MUST NOT BREAK)**

* On-chain core \= **real, minimal, immutable**

* Strategies \= **real protocols or explicit idle**

* Rebalance \= **real withdraw \+ transfer \+ supply**

* Withdraw must **always work**

* No feature is allowed to:

  * Simulate yield

  * Fake balances

---

## **2️⃣ ON-CHAIN ENTITIES LIST**

### **2.1. Required Contracts**

#### **(A) MantleYieldVault**

* Standard: **ERC-4626**

* Responsibilities:

  * Accept ERC-20 deposits

  * Mint / burn vault shares

  * Track total assets

  * Call strategy adapters to deploy / withdraw capital

❗ The Vault **does NOT**:

* Calculate internal yield

* Simulate APY

---

#### **(B) IStrategyAdapter (Interface)**

Standardizes all integrated strategies.

Minimum functions:

* `deposit(uint256 amount)`

* `withdraw(uint256 amount)`

* `totalAssets()`

❗ Adapters **must read real balances** from the underlying protocol.

---

#### **(C) StrategyAAdapter – REAL PROTOCOL**

* Adapter integrating a **real lending protocol on Mantle**

* Responsibilities:

  * Supply ERC-20 to protocol

  * Withdraw ERC-20 from protocol

  * Read real balances

Must NOT include:

* Fake counters

* Simulated yield

* Hard-coded APY

---

#### **(D) StrategyBAdapter – REAL or IDLE**

One of the following:

* A second **real DeFi protocol**  
   *(same integration pattern as Strategy A)*

**OR**

* **IdleStrategy**

  * Holds assets in the vault

  * Generates no yield

  * Considered a valid baseline

❗ **Idle ≠ mock**

---

### **2.2. Roles (MVP)**

| Role | Permissions |
| ----- | ----- |
| User | Deposit / Withdraw |
| Operator (admin) | Trigger rebalance |
| Others | ❌ Not applicable |

⚠️ No DAO, no governance token in MVP.

---

## **3️⃣ CORE FLOWS**

### **3.1. Happy Paths**

#### **Flow 1: Deposit**

1. User calls `deposit()` on the Vault

2. Vault:

   * Receives ERC-20

   * Mints ERC-4626 shares

   * Assets remain idle or follow initial config

✅ **Result**

* User receives vault shares

* `totalAssets` updates correctly

---

#### **Flow 2: Allocate / Rebalance (REAL)**

1. Operator calls `rebalance()`

2. Vault:

   * Withdraws ERC-20 from Strategy A

   * Vault ERC-20 balance updates **on-chain**

   * Supplies ERC-20 into Strategy B

   * Updates allocation mapping

✅ **Result**

* Capital moves **for real**

* Verifiable on block explorer

* No loss of funds

---

#### **Flow 3: Withdraw**

1. User calls `withdraw()`

2. Vault:

   * Withdraws from strategies if liquidity is insufficient

   * Burns shares

   * Transfers ERC-20 back to user

✅ **Result**

* User exits 100%

* No dependency on rebalance or automation

---

### **3.2. Fail Paths (PM MUST TEST)**

#### **Fail Path 1: Strategy Revert**

* Strategy call reverts

* Vault:

  * Does not update state

  * Does not lose funds

---

#### **Fail Path 2: Rebalance Exceeds Cap**

* Allocation exceeds predefined cap

* Transaction reverts

---

#### **Fail Path 3: Operator Inactive**

* No rebalance happens

* System still:

  * Accepts deposits

  * Allows withdrawals

---

#### **Fail Path 4: Emergency Pause**

* Deposit & rebalance paused

* Withdraw remains available

---

## **4️⃣ NON-GOALS (PM GUARDRAILS)**

### **4.1. Non-Goals (On-chain)**

❌ DAO governance  
❌ Token incentives  
❌ Price oracles  
❌ RWA custody / legal layers  
❌ Complex upgrade proxies  
❌ Multiple vaults

---

### **4.2. Non-Goals (Off-chain)**

❌ Mock yield  
❌ Simulated APY  
❌ Fake strategy returns  
❌ Keeper networks  
❌ AI / ML strategies  
❌ Indexers (The Graph)  
❌ Backend servers

---

### **4.3. Non-Goals (Product)**

❌ APY competition  
❌ Yield marketing  
❌ User growth features  
❌ Fancy UI / charts

---

## **🧠 FINAL DIRECTIVE FROM CORE TEAM (TO PM)**

The MantleYield MVP **must prove REAL capital routing between REAL DeFi protocols**.

Simplification is allowed. **Fake implementations are not**.

The PM has **full authority to reject any task** that shows signs of **mocking, simulation, or fake logic**.

---

# 🧩 TECH STACK SELECTION — MantleYield (English Version)

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