# TaskMesh — AI-Powered Task Matching on Blockchain

A hackathon MVP that combines **AI task matching** with **on-chain escrow payments**.

---

## Demo Flow

1. Connect MetaMask wallet
2. Create a project with a description
3. AI automatically breaks the project into tasks
4. For each task, AI scores and ranks contributors
5. Assign the best-matched contributor
6. Contributor marks task as done
7. Owner releases payment via smart contract

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Backend | Next.js API Routes (Node.js) |
| AI | OpenAI API (`gpt-4o-mini`) |
| Blockchain | Solidity smart contract (EVM) |
| Network | Monad Testnet |
| Wallet | MetaMask + ethers.js v6 |
| Database | In-memory (demo only) |

---

## Project Structure

```
├── contracts/
│   └── TaskMesh.sol          # Escrow smart contract
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home — project list
│   │   ├── project/
│   │   │   ├── create/page.tsx   # Create project + AI breakdown
│   │   │   └── [id]/page.tsx     # Project detail + AI matching
│   │   ├── board/[id]/page.tsx   # Task board + payment release
│   │   └── api/
│   │       ├── ai/breakdown/     # POST: AI task breakdown
│   │       ├── ai/extract-skills/ # POST: skill extraction
│   │       ├── ai/match/         # POST: contributor matching
│   │       ├── project/create/   # POST: create project
│   │       ├── project/[id]/     # GET + PATCH: project data
│   │       └── projects/         # GET: all projects
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── WalletConnect.tsx
│   │   ├── TaskCard.tsx
│   │   ├── MatchedUsers.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── store.ts          # In-memory project store
│   │   ├── mockUsers.ts      # 8 mock contributors
│   │   ├── contract.ts       # ethers.js helpers
│   │   └── contractABI.ts    # Contract ABI
│   └── types/index.ts
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-...          # Required for AI features
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # After deploying the contract
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
```

> **Note:** The app works without `OPENAI_API_KEY` — it falls back to realistic mock data. Perfect for demo if API limits are a concern.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Smart Contract Deployment

### Option A — Remix IDE (quickest)

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create `TaskMesh.sol` and paste the contract code from `contracts/TaskMesh.sol`
3. Compile with Solidity 0.8.20+
4. Connect MetaMask to **Monad Testnet**
   - RPC: `https://testnet-rpc.monad.xyz`
   - Chain ID: `10143`
   - Symbol: `MON`
5. Deploy using "Injected Provider - MetaMask"
6. Copy the deployed contract address
7. Paste it into `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

### Option B — Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Add to `hardhat.config.ts`:
```typescript
networks: {
  monad: {
    url: "https://testnet-rpc.monad.xyz",
    chainId: 10143,
    accounts: ["YOUR_PRIVATE_KEY"],
  }
}
```

```bash
npx hardhat run scripts/deploy.ts --network monad
```

---

## AI Functions

### `POST /api/ai/breakdown`
Input: `{ description: string }`  
Output: `{ tasks: [{ title, description, requiredSkills, payment }] }`

### `POST /api/ai/extract-skills`
Input: `{ description: string }`  
Output: `{ skills: string[] }`

### `POST /api/ai/match`
Input: `{ taskTitle: string, requiredSkills: string[] }`  
Output: `{ matches: [{ contributor, score, reasoning }] }`

---

## Smart Contract Interface

```solidity
function depositTask() external payable returns (uint256 taskId)
function assignTask(uint256 taskId, address payable assignee) external
function startTask(uint256 taskId) external
function completeTask(uint256 taskId) external
function releasePayment(uint256 taskId) external
function getTask(uint256 taskId) external view returns (...)
```

**Task States:** `Created → Assigned → InProgress → Done → Paid`

---

## Mock Contributors

The system includes 8 mock contributors with varying skills, reputation (78-96), and prices (0.035-0.10 ETH). AI matching scores them against task requirements in real-time.

---

## Notes

- In-memory store resets on server restart (by design for demo)
- Blockchain actions are optional — the app works fully off-chain for demo
- AI falls back to rule-based scoring if OpenAI key is not set
