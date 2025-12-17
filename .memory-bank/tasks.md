# ✅ MantleYield MVP – Role-Based Task Board (Final, Locked)

**Context:** Hackathon MVP · Infrastructure-grade DeFi primitive  
**Core Principle:** Real on-chain capital routing · Zero mock · Zero fake yield  
**Architecture Status:** ✅ Finalized & frozen  
**Backend:** ❌ None (Blockchain = backend)

---

## 👨‍💻 1️⃣ Bảo — Core Dev / Lead Smart Contract Engineer  
*(CTO · Architect · PM · Tech Lead — roles already completed, now 100% execution)*

### A. Smart Contract Implementation (Core Responsibility)

#### ERC-4626 Vault
- [ ] Implement `deposit()` (ERC-20 → shares)
- [ ] Implement `withdraw()` (shares → ERC-20)
- [ ] Ensure `totalAssets()` reflects **real on-chain balances**
- [ ] Maintain per-strategy allocation mapping
- [ ] Operator-only `rebalance()` (real asset movement)
- [ ] `pauseDeposit()` and `pauseRebalance()`
- [ ] **Withdraw must always work**, even when paused

#### Strategy System
- [ ] Define `IStrategyAdapter` interface
- [ ] Strategy A (Real DeFi protocol on Mantle):
  - [ ] Supply ERC-20 into protocol
  - [ ] Withdraw ERC-20 from protocol
  - [ ] Read real balance from protocol
- [ ] Idle Strategy:
  - [ ] Hold funds inside vault
  - [ ] No yield
  - [ ] No simulation

---

### B. Safety & Fail Paths (Mandatory)
- [ ] Allowance & approval checks
- [ ] Reentrancy protection (if applicable)
- [ ] Rebalance exceeding cap → revert
- [ ] Strategy revert → no state update, no asset loss
- [ ] Withdraw works when assets are deployed in strategy

---

### C. Deployment & Verification
- [ ] Deploy vault and strategies to Mantle testnet
- [ ] Verify all contracts on Mantlescan
- [ ] Record:
  - Vault address
  - Strategy addresses
  - Key transaction hashes

---

### D. Demo Readiness
- [ ] Prepare demo transactions:
  - Deposit
  - Rebalance
  - Withdraw
- [ ] Dry-run full demo multiple times
- [ ] Code freeze before submission

---

## 🎨 2️⃣ Thiên — Frontend Engineer / UI-UX Designer  
*(No onboarding · No learning phase · Official implementation only)*

### A. UI/UX Design (Figma — MUST be first)
- [ ] Design **desktop-first UI** in Figma
- [ ] Define **user flows** aligned with PM-READY:
  - Deposit → Rebalance → Withdraw
- [ ] Design **Vault Overview Screen**
  - totalAssets
  - user shares
  - strategy allocation
- [ ] Design **Deposit / Withdraw interactions**
- [ ] Design **Rebalance UI (Operator-only)**
- [ ] Design **State UI**:
  - Idle
  - Strategy A active
  - Paused
- [ ] Review & approve design with Core Dev

---

### B. Frontend Implementation (React + Vite)
- [ ] Initialize frontend project (official stack)
- [ ] Wallet connection (MetaMask / EVM compatible)
- [ ] Configure:
  - Mantle testnet
  - Vault address
  - Contract ABIs

---

### C. Core Functional Integration
- [ ] Implement `deposit()` call (ERC-4626)
- [ ] Implement `withdraw()` call
- [ ] Read-only data:
  - `totalAssets`
  - user shares
- [ ] Display **strategy allocation**
  - Explicit labels:
    - “Real DeFi Strategy”
    - “Idle Strategy (No Yield)”
- [ ] Implement **Rebalance button**
  - Visible only if `connectedAddress == operator`
- [ ] Display transaction hash after each action

---

### D. UX Rules (Strict)
- [ ] No charts
- [ ] No APY
- [ ] No simulated metrics
- [ ] Clear wording to avoid “fake yield” misunderstanding
- [ ] Minimal UI, infrastructure-style

---

### E. Demo Lock
- [ ] Full flow test: Deposit → Rebalance → Withdraw
- [ ] UI freeze before demo
- [ ] Frontend acts as **on-chain inspector + tx trigger**

---

## 🧪 3️⃣ Cảnh — Infra / Deployment / On-chain Verification Engineer  
*(No backend · No indexer · No off-chain services)*

### A. Deployment Infrastructure
- [ ] Configure Mantle testnet (RPC, chainId)
- [ ] Prepare deployer wallet
- [ ] Prepare demo ERC-20 asset

---

### B. Contract Deployment
- [ ] Prepare Hardhat deployment scripts
- [ ] Deploy:
  - MantleYieldVault
  - Strategy A (real protocol)
  - Idle Strategy
- [ ] Wire vault ↔ strategies (allocation config)
- [ ] Verify all contracts on Mantlescan

---

### C. On-chain Flow Testing (Evidence-driven)
- [ ] Test deposit when:
  - Funds are idle
  - Funds are deployed
- [ ] Test withdraw:
  - Full withdrawal
  - Partial withdrawal
- [ ] Test rebalance:
  - Strategy A → Idle
  - Idle → Strategy A

---

### D. Fail Path Validation (Mandatory)
- [ ] Strategy revert → no asset loss
- [ ] Rebalance beyond cap → revert
- [ ] Pause behavior:
  - Deposit blocked
  - Withdraw still works

---

### E. Demo Evidence
- [ ] Record transaction hashes:
  - Deposit
  - Rebalance
  - Withdraw
- [ ] Prepare **Demo Evidence Sheet**
  - Explorer links
  - Clear before/after balances
- [ ] Support live demo with Mantlescan

---

## 💼 4️⃣ Hiếu — Business Developer (Pitch & Q&A Owner)

### A. Narrative & Positioning
- [ ] Define problem:
  - Fragmented capital on Mantle
- [ ] Define solution:
  - ERC-4626 vault + real strategies
- [ ] Clarify positioning:
  - Infrastructure ≠ Yield farming app
- [ ] Explain Mantle fit:
  - Low gas → efficient rebalancing

---

### B. Judge Q&A Preparation
- [ ] “Why no automation?”
- [ ] “Why no backend?”
- [ ] “Why ERC-4626?”
- [ ] “Why not Yearn?”
- [ ] “Where is the real value?”

---

### C. Demo Script
- [ ] 3–5 minute pitch
- [ ] Emphasize:
  - Real capital movement
  - On-chain proof
  - Composability-first design

---

## 🧭 5️⃣ Project Owner / PM (Scope Guardian)

### A. Scope Control (Continuous)
- [ ] Reject any task involving:
  - Mock data
  - Fake yield
  - Off-chain backend
- [ ] Enforce principle:
  - “Blockchain is the backend”

---

### B. Final Gate
- [ ] End-to-end demo runs smoothly
- [ ] All transactions verifiable on-chain
- [ ] No hidden dependency outside:
  - Smart contracts
  - Frontend

---

## 🎯 FINAL NOTE

If all tasks above are completed:

✅ MantleYield qualifies as **infrastructure-grade DeFi MVP**  
✅ No risk of being flagged for mock, fake, or misleading demo  

**Principle:**  
> *Minimum components. Maximum on-chain truth.*