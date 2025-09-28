
<img width="1883" height="895" alt="Screenshot 2025-09-28 061817" src="https://github.com/user-attachments/assets/78824eda-ec50-4411-b2f0-856e73b955cd" />

# Insurance Protocol

A privacy-first, parametric insurance dApp leveraging **Self SDK** (ZK proofs), Celo smart contracts, and Chainlink oracles for automated, transparent travel/crop insurance.

---

## Features

- **ZK Identity Verification:** User privacy via [Self SDK](https://self.xyz/) proofs (used in contracts, frontend, and backend).
- **Parametric Insurance:** Automated payouts based on oracle data (flight/crop/weather).
- **Smart Contracts:** Solidity contracts on Celo (Alfajores/mainnet).
- **Oracles:** Chainlink Functions for external data feeds.
- **Non-Transferable SBTs:** Policy NFTs as proof of coverage.
- **Open APIs & Indexing:** Optional backend with Supabase/Postgres.
- **Full RLS Security:** Row-level security for all user data.

---

## Where Self SDK is Used

- **Frontend:**  
  - Users scan a Self QR code to generate a ZK proof of identity (age, country, non-OFAC).
  - Proof is sent to the smart contract for verification.
- **Smart Contracts:**  
  - `IdentityVerifier` contract receives and verifies Self ZK proofs.
  - Only verified users can buy insurance or claim payouts.
- **Backend (optional):**  
  - Can validate Self proofs off-chain for analytics or admin.
- **Database:**  
  - Policies are linked to verified user IDs (from Self).
  - RLS policies ensure only the owner (verified by Self) can access their data.

---

## Smart Contracts

| Contract              | Purpose                                                      |
|-----------------------|-------------------------------------------------------------|
| `IdentityVerifier`    | Verifies Self SDK ZK proofs for user onboarding             |
| `PolicySBT`           | Issues non-transferable SBTs as proof of insurance          |
| `InsurancePool`       | Manages policy purchase, premium collection, and payouts    |
| `InsuranceOracle`     | Handles Chainlink oracle requests and callbacks             |

**Minimal interfaces:**

```solidity
// IdentityVerifier.sol
function verifySelfProof(bytes calldata proof) external;
function isVerified(address user) external view returns(bool);
event IdentityVerified(address indexed user, bytes32 nullifier);

// PolicySBT.sol
function mintPolicy(address to, uint256 policyId, uint256 expiry, uint256 payout) external;
function ownerPolicy(address owner) external view returns(uint256);

// InsurancePool.sol
function buyPolicy(uint256 policyType, bytes calldata metadata) external;
function payout(uint256 policyId) external;
function fundPool(uint256 amount) external;

// InsuranceOracle.sol
function requestFlightStatus(string calldata flightNo, uint256 date) external returns(bytes32 requestId);
function fulfillRequest(bytes32 requestId, bytes calldata response) external;
```

---

## Database Tables

- **policies**: Tracks all insurance policies (linked to Self-verified users).
- **oracle_events**: Tracks oracle monitoring events.
- **policy_claims**: Tracks user claims and payouts.
- **oracle_monitoring**: Tracks ongoing oracle monitoring tasks.
- **payouts**: Tracks payout transactions and statuses.

See `/scripts/005_create_policy_tables.sql` and `/scripts/006_create_oracle_monitoring.sql` for schema.

---

## API Endpoints (suggested)

| Endpoint                        | Method | Description                                 |
|----------------------------------|--------|---------------------------------------------|
| `/api/policies`                 | GET    | List user policies (Self-authenticated)     |
| `/api/policies`                 | POST   | Create new policy (buy, requires Self proof)|
| `/api/oracle-events`            | GET    | List oracle events for user policies        |
| `/api/claims`                   | GET    | List user claims                            |
| `/api/claims`                   | POST   | Submit a claim (requires Self verification) |
| `/api/oracle-monitoring`        | GET    | List monitoring tasks for user policies     |
| `/api/payouts`                  | GET    | List user payouts                           |

---

## Operational Tasks

- **Deploy contracts**: Use Foundry/Hardhat scripts in `/scripts`.
- **Run database migrations**: Apply SQL files in `/scripts` to Supabase/Postgres.
- **Configure Chainlink Functions**: Set up jobs for flight/weather APIs.
- **Monitor payouts**: Use backend worker or Chainlink callback to trigger payouts.
- **Index events**: Optional backend for indexing and admin dashboards.
- **Integrate Self SDK**:  
  - Frontend: Use Self QR and proof submission.
  - Backend: Optionally verify proofs for admin/analytics.
  - Contracts: Only allow actions from Self-verified users.

---

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-org/insurance-protocol.git
   cd insurance-protocol
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**  
   Copy `.env.example` to `.env` and fill in your keys (see [INFRA_AND_DEPLOY.md](./INFRA_AND_DEPLOY.md) for details).

4. **Build & test contracts:**
   ```bash
   forge build
   forge test
   ```

5. **Deploy contracts:**
   ```bash
   forge create --rpc-url $CELO_RPC_URL --private-key $PRIVATE_KEY src/IdentityVerifier.sol:IdentityVerifier
   # Repeat for other contracts
   ```

6. **Run frontend:**
   ```bash
   cd frontend/nextjs-app
   npm run dev
   ```

---

## Documentation

- **Deployment & Infra:** See [INFRA_AND_DEPLOY.md](./INFRA_AND_DEPLOY.md)
- **Database Schema:** See `/scripts/005_create_policy_tables.sql` and `/scripts/006_create_oracle_monitoring.sql`
- **Smart Contract Interfaces:** In [INFRA_AND_DEPLOY.md](./INFRA_AND_DEPLOY.md)
- **Frontend Integration:** Self SDK quickstart in `/frontend/nextjs-app/`

---

## Contributing

1. Fork the repo and create your branch.
2. Make changes and add tests.
3. Submit a pull request.

---

## License

MIT

---

## Credits

- [Self.xyz](https://self.xyz/)
- [Celo](https://celo.org/)
- [Chainlink](https://chain.link/)
- [Supabase](https://supabase.com/)
