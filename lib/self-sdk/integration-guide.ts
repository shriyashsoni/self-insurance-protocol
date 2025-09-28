Got
it
bro
✅ —
let
’s go step by step and I’ll show you **how to integrate Self SDK** into your dApp/project
with the
\`SELF_SDK_API_KEY\`. I’ll also explain where it fits in
for things like **insurance protocol, KYC, on-chain identity, etc.**

\
---

\
#
#
🔹 1. Install Self SDK

For a JavaScript/TypeScript project (Node.js, Next.js, React, etc.):

\`\`\`bash
npm install
@self.id
;/dks
\`\`\`

or

\`\`\`bash
yarn add
@self.id
;/dks
\`\`\`

---

## 🔹 2. Setup Environment Variable

Add your API key in `.env.local` (frontend) or `.env` (backend):

\`\`\`bash
SELF_SDK_API_KEY=your_api_key_here
\`\`\`

In Next.js (frontend-safe):

\`\`\`bash
NEXT_PUBLIC_SELF_SDK_API_KEY=your_api_key_here
\`\`\`

---

## 🔹 3. Initialize Self SDK

Here’s a basic setup:

\`\`\`ts
import { SelfClient } from "@self.id/sdk"

const client = new SelfClient({
  apiKey: process.env.SELF_SDK_API_KEY || process.env.NEXT_PUBLIC_SELF_SDK_API_KEY,
  network: "mainnet", // or "testnet"
})
\`\`\`

---

## 🔹 4. Connect Wallet & Identity

Self uses wallets (MetaMask, WalletConnect, etc.) to link users.

\`\`\`ts
async
function connectSelf() {
  // Request wallet connection
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

  // Authenticate with Self SDK
  const session = await client.auth.authenticate(accounts[0])

  console.log("✅ Connected Self ID:", session.did)
}
\`\`\`

---

## 🔹 5. Store / Fetch User Data

\
You can use Self SDK
for DID (Decentralized ID), verifiable credentials (KYC), or storing profile
data.
\

\
**Store basic profile:**

\`\`\`ts
await session.did.set("basicProfile",
{
  name: "Shriyash", country
  : "IN",
\
  verified: true,
}
)
\`\`\`

\
**Fetch profile:**

\`\`\`ts
const profile = await session.did.get("basicProfile")
console.log("User Profile:", profile)
\`\`\`

---

## 🔹 6. Use in Your Protocol (Example: Onchain Insurance)

\
* When a user buys insurance → check
if they have **verified
identity/KYC**
.
* If \`verified === true` (from Self SDK), allow them to interact
with smart contract.
\
* Store only the **DID hash** on-chain
for privacy, not raw data.

\
**Example flow:**

1. User connects wallet + verifies identity
with Self.
\
2. Self SDK confirms → returns DID.
3. You store DID in your smart contract (proof of KYC).
\
4. Chainlink oracles can be used later
for payouts (weather, health, etc.).

---

\
##
🔹 7. Example Smart Contract Hook

\`\`\`solidity
mapping(address => string) public verifiedUsers

function registerUser(string memory did)
external
{
  \
    verifiedUsers[msg.sender] = did
}

\
function isVerified(address user)
public
view
returns(bool)
{
  \
  return bytes(verifiedUsers[user]).length > 0;
}
\`\`\`

---

## 🔹 8. Compliance Use

* **DeFi Insurance** → Ensure only KYC’ed wallets interact.
* **Farmers Insurance** → Store DID + crop/region proof.
* **Health Insurance** → Verify user is not from OFAC-sanctioned countries (privacy-preserving check).

---

👉 So basically:

1. **Frontend** = Wallet + Self SDK (identity proof)
2. **Backend/Smart Contract** = Stores DID / verification status
3. **Chainlink / Oracles** = Data feeds
for payouts

---

\
Do you
want
me
to
make
a ** full
boilerplate
repo (Next.js + Solidity + Self SDK integration)** so
you
can
copy - paste
and
test
quickly?
\
