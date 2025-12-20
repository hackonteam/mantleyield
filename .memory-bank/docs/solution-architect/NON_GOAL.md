# Non-Goals

## Purpose

This document explicitly defines what MantleYield **will NOT do** in the MVP, explains the rationale, and outlines what would be required to implement these features in the future.

> [!IMPORTANT]
> Non-goals protect scope and credibility. They demonstrate intentional design decisions, not limitations.

---

## Non-Goals Summary

| Category | Non-Goal | Why Not | What's Needed |
|----------|----------|---------|---------------|
| On-chain | DAO governance | Complexity, time | Governance contracts, token |
| On-chain | Token incentives | Out of scope | Tokenomics design, emission logic |
| On-chain | Price oracles | Not needed for routing | Oracle integration, validation |
| On-chain | Multiple vaults | MVP focus | Factory pattern, registry |
| Off-chain | Mock yield | **Anti-pattern** | Never allowed |
| Off-chain | Keeper automation | Time constraint | Keeper network, gas funding |
| Product | APY competition | Prove routing, not optimize | Real yield sources, algorithms |

---

## On-Chain Non-Goals

### ❌ DAO Governance

**What it means:**
- No governance token
- No proposal/voting system
- No decentralized admin

**Why not:**
| Factor | Assessment |
|--------|------------|
| Time required | 2-4 weeks minimum |
| Complexity | High (security-critical) |
| MVP relevance | Low |
| Hackathon expectation | Not required |

**What would be needed:**
- Governance token contract (ERC-20 + voting)
- Governor contract (OpenZeppelin Governor)
- Timelock contract
- Proposal/voting UI
- Community bootstrapping

---

### ❌ Token Incentives

**What it means:**
- No yield farming rewards
- No liquidity mining
- No native token emissions

**Why not:**
| Factor | Assessment |
|--------|------------|
| Tokenomics design | Weeks of modeling |
| Smart contract complexity | Additional audit risk |
| Economic sustainability | Requires careful planning |
| MVP scope | Distracts from core proof |

**What would be needed:**
- Token contract
- Emission schedule
- Distribution logic
- Vesting (if applicable)
- Economic sustainability analysis

---

### ❌ Price Oracles

**What it means:**
- No Chainlink integration
- No TWAP price feeds
- No on-chain APY calculation

**Why not:**
| Factor | Assessment |
|--------|------------|
| Use case | Not needed for MVP routing |
| Cost | Oracle gas overhead |
| Complexity | Feed validation, fallbacks |
| Risk | Oracle manipulation attacks |

> [!NOTE]
> MantleYield routes capital based on operator decisions, not algorithmic price comparisons. This is intentional simplification for MVP.

**What would be needed:**
- Chainlink price feed addresses on Mantle
- Oracle aggregation logic
- Staleness checks
- Fallback mechanisms
- Gas budget for oracle calls

---

### ❌ RWA Custody / Legal Layers

**What it means:**
- No real-world asset custody
- No legal wrapper contracts
- No KYC/compliance on-chain

**Why not:**
| Factor | Assessment |
|--------|------------|
| Legal complexity | Requires legal counsel |
| Jurisdiction | Multi-jurisdiction challenges |
| MVP scope | DeFi-native proof only |
| Timeline | Months, not days |

**What would be needed:**
- Legal entity structure
- Compliance framework
- KYC provider integration
- Regulated custody solution
- RWA protocol partnerships

---

### ❌ Complex Upgrade Proxies

**What it means:**
- No UUPS proxy
- No Diamond pattern
- No transparent proxy

**Why not:**
| Factor | Assessment |
|--------|------------|
| Audit requirement | Proxies need careful review |
| Complexity | Storage collision risks |
| MVP need | Immutable is simpler and safer |
| Trust model | Reduces admin key risks |

**MVP approach:**
Deploy immutable contracts. If upgrades needed, deploy new version and migrate.

**What would be needed:**
- OpenZeppelin proxy contracts
- Upgrade scripts
- Storage layout management
- Timelocked upgrade process
- Security audit of upgrade paths

---

### ❌ Multiple Vaults

**What it means:**
- Single vault only
- One asset type (USDC)
- No vault factory

**Why not:**
| Factor | Assessment |
|--------|------------|
| Scope creep | Each vault needs testing |
| Focus | Prove one vault works well |
| Complexity | Cross-vault accounting |
| Time | Factory pattern takes time |

**What would be needed:**
- Vault factory contract
- Vault registry
- Multi-asset strategy adapters
- Unified frontend
- Integration testing

---

## Off-Chain Non-Goals

### ❌ Mock Yield / Simulated APY

**What it means:**
- **ABSOLUTELY NO fake yield**
- No hardcoded return percentages
- No simulated balance growth

**Why not:**

> [!CAUTION]
> **This is not a scope decision. Mock yield is a PROHIBITED PATTERN.**

| Factor | Assessment |
|--------|------------|
| Integrity | Judges will detect mocking |
| Credibility | Destroys project credibility |
| Technical | Proves nothing about real integration |
| Ethics | Misrepresents capabilities |

**What would be needed:**
Never. This is never acceptable.

---

### ❌ Automated Keepers

**What it means:**
- No Gelato/Chainlink automation
- No keeper bot infrastructure
- Manual operator trigger only

**Why not:**
| Factor | Assessment |
|--------|------------|
| Time to implement | 1-2 weeks |
| Gas funding | Needs management |
| Complexity | Keeper reliability issues |
| MVP proof | Manual proves concept equally |

**What would be needed:**
- Keeper contract with trigger logic
- Gelato/Chainlink Automation setup
- Gas tank funding
- Threshold/timing configuration
- Monitoring dashboard

---

### ❌ AI/ML Strategies

**What it means:**
- No machine learning yield prediction
- No AI-powered allocation
- No automated decision making

**Why not:**
| Factor | Assessment |
|--------|------------|
| Complexity | Far beyond MVP scope |
| Data requirements | Historical yield data needed |
| Validation | Hard to prove correctness |
| Expectation | Not required for hackathon |

**What would be needed:**
- Historical yield data collection
- ML model training infrastructure
- On-chain/off-chain prediction pipeline
- Validation framework
- Risk management layer

---

### ❌ Indexers (The Graph)

**What it means:**
- No subgraph deployment
- No indexed historical data
- Frontend reads chain directly

**Why not:**
| Factor | Assessment |
|--------|------------|
| Time | Subgraph setup takes time |
| Infrastructure | Hosted service or self-host |
| MVP need | Direct RPC sufficient for demo |

**What would be needed:**
- Subgraph schema definition
- Event mappings
- The Graph deployment (hosted/self)
- Frontend query integration

---

### ❌ Backend Servers

**What it means:**
- No off-chain server
- No database
- Pure frontend + smart contracts

**Why not:**
| Factor | Assessment |
|--------|------------|
| Decentralization | On-chain is the source of truth |
| Complexity | Server adds failure points |
| Hosting | Additional infrastructure |
| MVP simplicity | Not needed |

**What would be needed:**
- Server framework (Node.js, etc.)
- Database (if persistent state needed)
- API design
- Hosting infrastructure
- Security considerations

---

## Product Non-Goals

### ❌ APY Competition / Optimization

**What it means:**
- Not claiming best yields
- Not optimizing allocation algorithms
- Not comparing to Yearn/Beefy

**Why not:**
| Factor | Assessment |
|--------|------------|
| MVP purpose | Prove architecture, not performance |
| Expectation | MVP is proof-of-concept |
| Yield variance | Testnet yields meaningless |

**What would be needed:**
- Multiple high-yield protocol integrations
- Yield comparison algorithms
- Gas-optimized rebalancing
- Historical performance tracking

---

### ❌ Yield Marketing

**What it means:**
- No APY guarantees
- No "earn X%" claims
- No competitive positioning

**Why not:**
- Testnet yields are not meaningful
- Marketing claims require proof
- MVP is technical demonstration

---

### ❌ User Growth Features

**What it means:**
- No referral system
- No gamification
- No points/rewards for users

**Why not:**
- MVP audience is judges, not users
- Growth features distract from core proof
- Time better spent on core functionality

---

### ❌ Fancy UI / Charts

**What it means:**
- Minimal functional UI only
- No elaborate dashboards
- No real-time charts

**Why not:**
| Factor | Assessment |
|--------|------------|
| Time | Visual polish takes significant effort |
| Priority | Functional > Beautiful for MVP |
| Value | Judges evaluate architecture, not design |

**What would be needed:**
- Design system
- Charting library (Recharts, etc.)
- Real-time data feeds
- Responsive design
- Animation polish

---

## Decision Framework

When evaluating new feature requests, apply this filter:

```
┌─────────────────────────────────────────────────────────┐
│           FEATURE REQUEST DECISION TREE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Is it required to prove capital routing?               │
│  ├── YES → Consider for MVP                            │
│  └── NO → Is it explicitly prohibited (mocking)?       │
│           ├── YES → REJECT (never allowed)             │
│           └── NO → Add to post-hackathon roadmap       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

| Status | Items |
|--------|-------|
| ✅ **In Scope** | ERC-4626 vault, real strategies, manual rebalance, minimal UI |
| ❌ **Out of Scope** | Governance, tokens, oracles, automation, fancy UI |
| 🚫 **Prohibited** | Mock yield, simulated APY, fake balances |
