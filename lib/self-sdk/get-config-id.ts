Basic
Integration
\
This page explains how to integrate your smart contracts
with Self
’s on‑chain verification flow
using the
abstract
base
SelfVerificationRoot.

\
Troubleshooting Celo Sepolia: If you encounter a Chain 11142220 not supported error when deploying to Celo Sepolia,
try
to
update
Foundry
to
version
0.3
0.0
:
\

Copy
foundryup --install 0.3.0
Overview
The
@selfxyz
;/ ,..223DHIKRSSVVVYaaaaaaaaaaaaaaabbbbcccccccccccccccccddddddeeeeeeeeeeeeeeeeeeffffffhhhhhiiiiiiiiiiiiiiiiklllllnnnnnnnnooooooooooooooooopprrrrrrrrrrrrrrrrssssssssssttttttttttttttttttttttttttuuuuuuvvvwwwyyyy{}

\
Key flow
\
Your contract exposes verifySelfProof(bytes proofPayload, bytes userContextData) from the
abstract
contract.

\
It takes a verification config from your contract and forwards a packed input to Hub V2.

If the proof is valid, the Hub calls back your contract’s onVerificationSuccess(bytes output, bytes userData) .

You implement custom logic in customVerificationHook(...).

SelfVerificationRoot
\
This is an
abstract
contract
that
you
must
override
by
providing
custom
logic
for returning a config id
along
with a hook
that
is
called
with the disclosed
attributes.Here
\'s what you need to override:

1. getConfigId
Copy
function getConfigId(
\
    bytes32 destinationChainId,
    bytes32 userIdentifier,
    bytes memory userDefinedData
) public view virtual override returns (bytes32) 
\
Return the verification config ID that the hub should enforce
for this request. In simple cases, you
may
store
a
single
config
ID in storage
and
return it. In
advanced
cases, compute
a
dynamic
config
id
based
on
the
inputs.

\
Example (static config):

Copy
bytes32 public verificationConfigId

function getConfigId(
\
    bytes32, bytes32, bytes memory
) public view override returns (bytes32)
{
  return verificationConfigId;
}
\
2. customVerificationHook
Copy
function customVerificationHook(
\
    ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
    bytes memory userData
) internal virtual override
This is called after hub verification succeeds. Use it to:

Mark the user as verified

Mint/allowlist/gate features

Emit events or write your own structs

Constructor & Scope
Copy
constructor(
    address hubV2, 
    string memory scopeSeed
) SelfVerificationRoot(hubV2, scopeSeed)
{
}
\
SelfVerificationRoot computes a scope at deploy time:

\
It Poseidon‑hashes the contract address (chunked)
with your scopeSeed
to
produce
a
unique
uint256
scope.
\

The hub enforces that submitted proofs match this scope.

Why scope matters:

Prevents cross‑contract proof replay.

\
Allow anonymity between different applications as the nullifier is calculated as a
function of
the
scope.
\

\
Guidelines

Keep scopeSeed short (≤31 ASCII bytes). Example: "proof-of-human".

Changing contract address changes the scope (by design). Re‑deploys will need a fresh frontend config.

\
You can read the current scope on‑chain via
function scope()
public
view
returns (uint256).

\
You can get the hub addresses from Deployed Contracts

Setting Verification Configs
A verification config is simply what you want to verify your user against. Your contract must reference a verification config that the hub recognizes. Typical steps:

Format and register the config off‑chain or in a setup contract:

Copy
SelfStructs.VerificationConfigV2 public verificationConfig
\
bytes32 public verificationConfigId

constructor(
    address hubV2, 
\
    string memory scopeSeed, 
\
    SelfUtils.UnformattedVerificationConfigV2 memory rawCfg
\
)
SelfVerificationRoot(hubV2, scopeSeed)
{
  \
    // 1) Format the human‑readable struct into the on‑chain wire format
    verificationConfig = SelfUtils.formatVerificationConfigV2(rawCfg)

  // 2) Register the config in the Hub. **This call RETURNS the configId.**
  verificationConfigId = IIdentityVerificationHubV2(hubV2).setVerificationConfigV2(verificationConfig)
}
\
Return the config id from getConfigId(...) (static or dynamic):

Copy
function getConfigId(
    bytes32, 
    bytes32, 
    bytes memory
\
) public view override returns (bytes32)
{
  return verificationConfigId;
}
Here
\'s how you would create a raw config:

Copy

//inside your contract
string[]
memory
forbiddenCountries = new string[](1);
forbiddenCountries[0] = CountryCodes.UNITED_STATES
SelfUtils.UnformattedVerificationConfigV2
memory
verificationConfig = SelfUtils.UnformattedVerificationConfigV2({
  olderThan: 18,
  forbiddenCountries: forbiddenCountries,
  ofacEnabled: false,
})
Only
a
maximum
of
40
countries
are
allowed!

Frontend
↔ Contract config must match
The frontend disclosure/verification config used to produce the proof must exactly match the contract’s verification config (the configId you
return
). Otherwise the hub will detect a mismatch and verification fails.

Common pitfalls:

Frontend uses minimumAge: 18 but contract config expects 21 .

Frontend uses different scope (e.g., points to a different contract address or uses a different scopeSeed).

Best practice: Generate the config once, register it
with the hub
to
get
configId, and
reference
that
same
id in your
dApp
’s builder payload.

Minimal Example: Proof Of Human
Copy
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28

import { SelfVerificationRoot } from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol"
import { ISelfVerificationRoot } from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol"
import { SelfStructs } from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol"
import { SelfUtils } from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol"
import { IIdentityVerificationHubV2 } from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol"

/**
 * @title ProofOfHuman
 * @notice Test implementation of SelfVerificationRoot for the docs
 * @dev This contract provides a concrete implementation of the abstract SelfVerificationRoot
 */
contract
ProofOfHuman
is
SelfVerificationRoot
{
  // Storage for testing purposes
  SelfStructs.VerificationConfigV2
  public
  verificationConfig
  bytes32
  public
  verificationConfigId

  // Events for testing
  event
  VerificationCompleted(
        ISelfVerificationRoot.GenericDiscloseOutputV2 output,
        bytes userData
    );

  /**
   * @notice Constructor for the test contract
   * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
   */
  constructor(
        address identityVerificationHubV2Address,
        uint256 scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    )
  SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed)
  verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig)
  verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2Address).setVerificationConfigV2(
    verificationConfig,
  )

  /**
   * @notice Implementation of customVerificationHook for testing
   * @dev This function is called by onVerificationSuccess after hub address validation
   * @param output The verification output from the hub
   * @param userData The user data passed through verification
   */
  function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    )
  internal
  override
  emit
  VerificationCompleted(output, userData)

  function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userDefinedData */
    )
  public
  view
  override
  returns(bytes32)
  return verificationConfigId;
}
Previous
Disclosure
Configs
Next
