# ✅ MantleYield MVP – Role-Based Checklist (PM View)

**Context:** Hackathon MVP · 14 days · No off-chain backend · Operator-triggered Rebalance  
**Goal:** Demonstrate **real on-chain capital routing** with zero mock, zero fake yield.

---

## 👨‍💻 1️⃣ Core Dev / Lead Developer (On-chain Owner)

### A. Pre-Implementation (Day 1–2)
- [ ] Select **real DeFi protocol** on Mantle testnet
- [ ] Confirm **demo ERC-20 asset**
- [ ] Draw capital flow diagram:
  - Vault → Strategy A
  - Vault → Idle Strategy
- [ ] Finalize:
  - Operator address
  - Allocation caps / limits

---

### B. Smart Contract Implementation (Day 3–8)

#### ERC-4626 Vault
- [ ] Implement `deposit()`
- [ ] Implement `withdraw()`
- [ ] Ensure `totalAssets()` reflects **real balances**
- [ ] Manage per-strategy allocations
- [ ] Operator-only `rebalance()`
- [ ] `pauseDeposit`, `pauseRebalance`
- [ ] Withdraw must work **even when paused**

#### Strategy Adapters
- [ ] Define `IStrategyAdapter` interface
- [ ] Strategy A (real protocol):
  - [ ] Deposit into protocol
  - [ ] Withdraw from protocol
  - [ ] Read real balance
- [ ] Idle Strategy:
  - [ ] Keep funds in vault
  - [ ] No yield, no simulation

---

### C. Safety & Edge Cases (Day 9–11)
- [ ] Allowance / approval checks
- [ ] Reentrancy protection (if needed)
- [ ] Rebalance exceeding cap → revert
- [ ] Strategy revert → no asset loss
- [ ] Withdraw when funds are deployed

---

### D. Deployment & Verification (Day 11–12)
- [ ] Deploy vault + strategies to Mantle testnet
- [ ] Verify contracts on Mantlescan
- [ ] Record:
  - Vault address
  - Strategy addresses
  - Key transaction hashes

---

### E. Demo Readiness (Day 13–14)
- [ ] Prepare demo transactions:
  - Deposit
  - Rebalance
  - Withdraw
- [ ] Dry-run full demo 2–3 times

---

## 🎨 2️⃣ Intern Dev – Frontend

### A. Setup (Day 3–4)
- [ ] Initialize Vite + React
- [ ] Wallet connection (MetaMask / compatible)
- [ ] Configure:
  - Chain ID
  - Vault address
  - ABI

---

### B. Core UI (Day 5–9)
- [ ] Deposit form
- [ ] Withdraw form
- [ ] Display:
  - `totalAssets`
  - Allocation per strategy
- [ ] Clear labels:
  - “Real Lending Strategy”
  - “Idle Strategy (No Yield)”

---

### C. Rebalance UI (Day 9–10)
- [ ] **Rebalance** button
- [ ] Visible only if `connectedAddress == operator`
- [ ] Display transaction hash after execution

---

### D. Polish & Demo (Day 11–14)
- [ ] Minimal UI (no charts)
- [ ] Basic loading & error states
- [ ] Test full flow:
  - Deposit → Rebalance → Withdraw
- [ ] Prepare live demo URL

---

## 🧪 3️⃣ Intern Dev – Infra / Deployment & Testing  
*(No off-chain backend)*

### A. Environment & Setup (Day 1–3)
- [ ] Configure Mantle testnet
- [ ] Prepare deployer wallet
- [ ] Verify demo token availability

---

### B. Flow Testing (Day 6–10)
- [ ] Test deposit when:
  - Vault is idle
  - Funds are deployed
- [ ] Test withdraw:
  - Full withdrawal
  - Partial withdrawal
- [ ] Test rebalance:
  - Strategy A → Idle
  - Idle → Strategy A

---

### C. Fail Case Validation (Day 9–11)
- [ ] Strategy revert → no asset loss
- [ ] Rebalance beyond cap → revert
- [ ] Pause behavior:
  - Deposit blocked
  - Withdraw still works

---

### D. Demo Evidence (Day 12–14)
- [ ] Collect:
  - Transaction hashes
  - Explorer links
- [ ] Prepare tx list for PM demo

---

## 💼 4️⃣ Business Developer (Pitch & Q&A Owner)

### A. Narrative & Slides (Day 3–8)
- [ ] Problem:
  - Fragmented DeFi capital on Mantle
- [ ] Solution:
  - ERC-4626 vault + real strategies
- [ ] Mantle fit:
  - Low gas → efficient rebalancing
- [ ] Clarify:
  - MVP ≠ APY competition

---

### B. Q&A Preparation (Day 9–12)
- [ ] “Why no automation?”
- [ ] “Why no backend?”
- [ ] “Why ERC-4626?”
- [ ] “Why not Yearn?”

---

### C. Demo Script (Day 13–14)
- [ ] 3–5 minute pitch script
- [ ] Emphasize:
  - Real capital movement
  - On-chain proof
  - Infrastructure-first mindset

---

## 🧭 5️⃣ Project Manager / Project Owner

### A. Scope Control (Continuous)
- [ ] Reject tasks involving:
  - Mock data
  - Fake yield
  - Backend services
- [ ] Reinforce principle:
  - “Blockchain is the backend”

---

### B. Sync & Review
- [ ] Daily progress check
- [ ] Verify no scope drift
- [ ] Review demo flow every 2–3 days

---

### C. Final Gate (Day 14)
- [ ] End-to-end demo runs smoothly
- [ ] All transactions verifiable on-chain
- [ ] No dependency outside:
  - Smart contracts
  - Frontend

---

## 🎯 PM FINAL NOTE

If all items above are checked ✅  
→ MantleYield MVP **passes hackathon-grade infrastructure standards**  
→ No risk of being flagged for mock, fake, or hidden centralization

**Principle:**  
> *Minimum components, maximum on-chain truth.*