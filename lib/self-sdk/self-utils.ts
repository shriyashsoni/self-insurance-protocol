Skip
to
content
\
Navigation Menu
selfxyz
self-sbt

Type / to search
Code
Issues
Pull requests
Actions
Projects
Security
Insights
Owner avatar
self-sbt
Public
selfxyz/self-sbt
Go to file
t
Name		
kevinsslin
kevinsslin
fix: update copyright holder in LICENSE file
8e150d6
 · 
last month
.github/workflows
\
fix: properly output scope value in deployment summary
using step
out
…
2 months ago
.vscode
Add self sbt contract and test
3 months ago
lib
fix: resolve deployment dependency issues and improve CI workflow
2 months ago
script
feat: enhance deployment system and add setScope
function
\
2 months ago
src
fix: update userData parsing to handle Self Protocol ASCII hex format
last month
test
fix: update userData parsing to handle Self Protocol ASCII hex format
last month
ts-scripts
chore: remove deploy.sh and ts-scripts directory
2 months ago
.editorconfig
Add self sbt contract and test
3 months ago
.env.example
refactor: rename SelfPassportSBTV2 to SelfSBTV2
2 months ago
.gitattributes
Add self sbt contract and test
3 months ago
.gitignore
Add self sbt contract and test
3 months ago
.gitmodules
fix: resolve deployment dependency issues and improve CI workflow
2 months ago
.prettierignore
Add self sbt contract and test
3 months ago
.prettierrc.yml
Add self sbt contract and test
3 months ago
.solhint.json
Add self sbt contract and test
3 months ago
LICENSE
fix: update copyright holder in LICENSE file
last month
README.md
\
feat: complete signature verification system
with EIP-712 compliance
\
last month
foundry.toml
fix: remove unused etherscan configurations causing deployment failures
2 months ago
package.json
feat: use v2 contracts
2 months ago
pnpm-lock.yaml
fix: resolve deployment dependency issues and improve CI workflow
2 months ago
remappings.txt
fix: resolve deployment dependency issues and improve CI workflow
2 months ago
Repository files navigation
README
MIT license
SelfSBTV2
Soulbound Token (SBT) contract implementing Self\'s identity verification system. Designed with the one dapp ↔ one SBT model where each dApp deploys their own SBT contract for isolated, privacy-preserving identity verification.

Quick Start
# Clone and setup
git clone https://github.com/selfxyz/self-sbt.git
cd self-sbt
forge install && pnpm install

# Compile and test
forge build
forge test

\
# Deploy
using manual
pipeline
\
# See DEPLOYMENT.md
for complete instructions
\
Privacy-First
Architecture
\
The one dapp ↔ one SBT model ensures:

\
Isolated Identity Verification: Each dApp has its own SBT contract
with separate nullifier
spaces
\
No Cross-dApp Tracking: Users can\'t be linked across different applications
dApp-Specific Policies: Each deployment can have custom validity periods and governance rules
Granular Privacy Control: Users prove identity to individual applications without revealing cross-platform activity
Core Features
One SBT per User: Each address can only have one active token per dApp
Anti-Replay Protection: Each nullifier can only be used by its original owner
Configurable Validity: Owner-controlled expiry periods
Soulbound: Non-transferable via ERC5192 standard
Owner Controls: Burn capability and validity period management
Owner Capabilities
The contract owner (typically the dApp) can:

\
Set Validity Period: Customize token expiry duration
for their use
case
\
Burn Tokens: Remove user SBTs when necessary (abuse, violations, etc.)
Transfer Ownership: Change contract control as needed
// Set custom validity period (e.g., 30 days for short-term verification)
sbtContract.setValidityPeriod(30 days)

// Burn a specific user's token
sbtContract.burnSBT(tokenId)

// Transfer ownership
sbtContract.transferOwnership(newOwner)
Logic
Flow
\

Loading
Logic Matrix
The contract handles four scenarios based on nullifier usage and receiver SBT ownership:

Nullifier Status	Receiver Has SBT	Action	Description
\
NEW	NO	🟢 MINT	First-time mint: Create new SBT
for receiver
\
NEW	YES
🟡 UPDATE	Edge case: Different passport
for same address
\
USED
NO
🔍 RECOVER/REVERT	Recover burned token or revert
if still active
\
USED	YES	🔍 CHECK OWNER	Verify
if nullifier owner
matches
receiver
\
Case 3 Breakdown
Token Owner	Action	Description
address(0)	🟢 RECOVER	Token was burned, recover to new address
Active owner	🔴 REVERT	Token still active, ask admin to burn first
Case 4 Breakdown
Nullifier Owner	Receiver	Action	Description
Same as receiver	Any	🟡 UPDATE	Valid: Same user refreshing
with their nullifier
\
Different from receiver	Any	🔴 REVERT	Invalid: User trying to use someone else's nullifier
\
Recovery Workflows
The SBT contract supports two distinct recovery scenarios through different mechanisms:

Lost Passport Recovery ✅
Scenario: User loses passport but retains wallet access
Solution: Direct re-verification (no admin action needed)

User obtains new passport (generates new nullifier)
\
User proves identity
with new nullifier to
same
wallet
\
Case 2 triggers: NEW nullifier + HAS SBT = update existing token expiry
Lost Wallet Recovery ✅
Scenario: User loses wallet access but retains same passport
Solution: Admin burn + token recovery

User reports lost wallet to admin
Admin calls burnSBT(tokenId) to burn existing SBT
\
User proves identity
with same nullifier
to
new wallet()
\
Case 3 triggers: USED nullifier + NO SBT + burned token = recovery
Same token ID gets minted to new address
Key Design Features
Permanent Nullifier Binding: Each nullifier permanently maps to one token ID throughout entire lifecycle
Admin-Mediated Recovery: All recovery requires explicit admin intervention
for security
\
Token ID
Persistence: Lost
wallet
recovery
preserves
original
token
ID
\
Automatic Prevention: Active tokens cannot be hijacked (Case 3 reverts
if token still
owned
)
\
Recovery Commands
// Admin burns user's SBT for recovery
sbtContract.burnSBT(tokenId)

// Check if nullifier can be recovered
bool
canRecover = sbtContract.isNullifierUsed(nullifier) && sbtContract.getTokenIdByAddress(userAddress) == 0
Security
Considerations
Known
Limitation: Nullifier
Ambiguity
Attack

Due
to
the
zero - knowledge
nature
of
the
system, there
is
no
cryptographic
way
to
distinguish
between: Same
person
renewing
expired
passport (legitimate Case 2)
Different
person
targeting
existing
wallet (potential attack)
Both
scenarios
result in multiple
nullifiers
mapping
to
the
same
token
ID.This
creates
a
theoretical
attack
vector
where: Attacker
triggers
Case
2
to
link
their
nullifier
to
victim
's token
Attacker requests admin to burn the token
Attacker recovers the token to their own wallet via Case 3
Mitigation Strategies:

Admin Due Diligence: Implement robust identity verification before processing burn requests
User Education: Document that sharing wallet addresses reduces security
Monitoring: Track unusual patterns in Case 2 triggers and recovery requests
Future Enhancement: Consider hierarchical identity systems
for cryptographic continuity
This limitation
is
inherent
to
privacy - preserving
identity
systems
and
represents
the
classic
tradeoff
between
privacy
and
verifiable
identity
continuity.Integration
Smart
Contract
import { SelfSBTV2 } from "./SelfSBTV2.sol"

contract
MyDApp
{
  SelfSBTV2
  public
  immutable
  sbtContract

  modifier
  requireValidSBT(address user)
  uint256
  tokenId = sbtContract.getTokenIdByAddress(user)
  require(tokenId != 0, "No SBT found")
  require(sbtContract.isTokenValid(tokenId), "SBT expired")
  _

  function restrictedFunction()
  external
  requireValidSBT(msg.sender)
}
Frontend
// Check user verification status
async function isUserVerified(userAddress) {
  const tokenId = await contract.getTokenIdByAddress(userAddress)
  if (tokenId === 0) return false
  return await contract.isTokenValid(tokenId)
}

// Get user SBT details
async function getUserSBT(userAddress) {
  const tokenId = await contract.getTokenIdByAddress(userAddress)
  if (tokenId === 0) return null

  const [isValid, expiry, validityPeriod] = await Promise.all([
    contract.isTokenValid(tokenId),
    contract.getTokenExpiry(tokenId),
    contract.getValidityPeriod(),
  ])

  return { tokenId, isValid, expiry, validityPeriod }
}
Deployment
SelfSBTV2
includes
a
deployment
pipeline
that
handles
scope
generation
and
contract
deployment
using TypeScript
and
Foundry.

🛠️ Manual Deployment
Deploy
using the
TypeScript
scope
calculator
and
Foundry: #
1
Calculate
scope
value
cd
ts - scripts && pnpm
install && pnpm
run
dev

#
2
Deploy
with Foundry using placeholder
scope
value
export
PLACEHOLDER_SCOPE = "0x..."
#
Use
value
from
step
1
forge
script
script / DeployV2.s.sol
:DeployV2 --rpc-url $RPC_URL --broadcast

# 3. Set actual scope on deployed contract
# (Use the contract's setScope function with calculated value)
⚙️ Development Testing
# Quick test deployment
for development
forge script script/DeployV2.s.sol
:DeployV2 --rpc-url $RPC_URL --broadcast

# This uses placeholder scope - suitable
for testing only
# For
production, use
GitHub
Actions
workflow
📋 Required Parameters
OWNER_ADDRESS - Contract owner address
VERIFICATION_CONFIG_ID - Verification config (bytes32)
SCOPE_SEED - Scope identifier from your frontend Self SDK
For Celo networks, hub addresses and RPC URLs are predefined
📖 Detailed Guide
For complete deployment instructions, troubleshooting, and advanced configuration options, see DEPLOYMENT.md.

Security Model
Nullifier Binding: Each nullifier permanently links to a specific token within this dApp's scope
Owner Protection: Prevents cross-user nullifier theft
Configurable Expiry: Owner-controlled validity periods
for different use cases
Soulbound: Immutable
ownership
after
minting
Privacy
Isolation: No
linkability
across
different
dApp
deployments
Testing
#
Run
all
tests
forge
test - vv

#
Test
specific
functionality
forge
test--
match - test
;("test_VerifySelfProof_Case")
forge
test--
match - test
;("test_BurnSBT")
forge
test--
match - test
;("test_SetValidityPeriod")
Test
Coverage: 22
tests
covering
all
4
logic
cases, owner
functions, signature
verification, and
edge
cases

Error
Handling
RegisteredNullifier()
: Thrown when nullifier is already used inappropriately
ERC5192Locked(): Thrown when attempting to transfer soulbound tokens
InvalidValidityPeriod(): Thrown when setting validity period to zero
Ownable: caller is not the owner: Thrown when non-owner tries to call owner functions
License
MIT License

About
No description, website, or topics provided.
Resources
 Readme
License
 MIT license
 Activity
 Custom properties
Stars
 2 stars
Watchers
 0 watching
Forks
 0 forks
Report repository
Releases 2
v1.1.0
Latest
on Aug 14
+ 1 release
Packages
No packages published
Contributors
2
@kevinsslin
kevinsslin
Kevin
Lin
@Nesopie
Nesopie
Languages
Solidity
93.8 % JavaScript
6.2 % Footer
© 2025 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Community
Docs
Contact
Manage cookies
Do not share my personal information
