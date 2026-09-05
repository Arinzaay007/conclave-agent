// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BallotEmitter — sealed-ballot attestations for the Conclave committee.
/// @notice Every persona ballot hash is committed on-chain BEFORE the verdict
///         (and any order) exists. Ballots are later revealed off-chain; anyone
///         can re-hash a revealed ballot and confirm it matches the commitment.
///         This gives Conclave a tamper-evident, decision-to-action audit trail
///         that does not depend on trusting our server.
/// @dev    Deployed target: BSC testnet (chainId 97). The committee operator
///         commits ballot hashes via `seal`; `reveal` emits the cleartext for
///         indexers. This contract attests to hashes only — it never custodies
///         or moves funds.
contract BallotEmitter {
    struct SealedBallot {
        bytes32 commitHash;   // keccak256 of the canonical ballot JSON
        address committer;    // the committee operator / agent key
        uint64  sealedAt;
        bool    revealed;
        bytes32 revealHash;   // keccak256 of the revealed cleartext (optional)
    }

    uint64 public nonce;
    mapping(uint64 => SealedBallot) public ballots;

    event BallotSealed(uint64 indexed id, bytes32 indexed commitHash, address indexed committer, uint64 sealedAt);
    event BallotRevealed(uint64 indexed id, bytes32 revealHash);

    error AlreadyRevealed();
    error UnknownBallot();

    /// @notice Commit a sealed ballot hash before the trade decision is known.
    function seal(bytes32 commitHash) external returns (uint64 id) {
        id = nonce++;
        ballots[id] = SealedBallot({
            commitHash: commitHash,
            committer: msg.sender,
            sealedAt: uint64(block.timestamp),
            revealed: false,
            revealHash: bytes32(0)
        });
        emit BallotSealed(id, commitHash, msg.sender, uint64(block.timestamp));
    }

    /// @notice Mark a ballot revealed with the hash of its cleartext.
    function reveal(uint64 id, bytes32 revealHash) external {
        SealedBallot storage b = ballots[id];
        if (b.commitHash == bytes32(0)) revert UnknownBallot();
        if (b.revealed) revert AlreadyRevealed();
        b.revealed = true;
        b.revealHash = revealHash;
        emit BallotRevealed(id, revealHash);
    }

    /// @notice Off-chain helper: verify a revealed ballot against its commitment.
    function verify(uint64 id, bytes32 commitHashOfCleartext) external view returns (bool) {
        return ballots[id].commitHash == commitHashOfCleartext;
    }
}
