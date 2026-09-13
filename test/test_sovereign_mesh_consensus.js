/**
 * test/test_sovereign_mesh_consensus.js
 * Automated Verification Suite for SovereignMeshConsensus Engine:
 * 1. Monotonic Deadlock-Free Peer Lock Acquisition (Daf al-Dawr)
 * 2. Directed Acyclic Graph (DAG) Mesh Routing with Loop Prevention (Daf al-Dawr)
 * 3. Bounded Gossip Protocol & Deduplication Cache (Daf al-Tasalsul)
 * 4. Byzantine Epoch Consensus & Non-Contradiction (Adam al-Tanaqud)
 * 5. Ibn Manzur Typed Error Hierarchy Verification
 *
 * Epistemically governed by Ghazali Mantiq RAG + DeepSeek Flash 4.1.
 * Zero emojis. Pure apodictic verification.
 */

const assert = require("assert");
const {
  SovereignMeshConsensus,
  ConsensusEpochState,
  SovereignMeshError,
  ConsensusDeadlockViolationError,
  MeshHopLimitExceededError,
  EpochDivergenceError,
  SignatureVerificationError,
  MeshRoutingCycleError,
  ConsensusPreconditionError,
} = require("../src/network/SovereignMeshConsensus");

let passCount = 0;
let failCount = 0;

function reportPass(testName) {
  passCount++;
  console.log(`[PASS] ${testName}`);
}

function reportFail(testName, error) {
  failCount++;
  console.error(`[FAIL] ${testName}:`, error);
}

async function runTestSuite() {
  console.log("=== SovereignMeshConsensus Verification Suite (Ghazali Mantiq) ===");

  const configuration = {
    maximumGossipHopTtl: 16,
    deterministicReplicationFanout: 3,
    maximumDeduplicationCacheEntries: 1000,
    quorumThresholdNumerator: 2,
    quorumThresholdDenominator: 3,
    maximumEpochDurationMillis: 30000,
  };

  // --------------------------------------------------------------------------
  // TEST 1: Initialization Preconditions (Qiyas Burhani)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    assert.strictEqual(engine.currentDeduplicationCacheEntryCount(), 0);
    assert.strictEqual(engine.currentLamportClock(), 0);
    reportPass("Test 1: Engine initializes with pristine axiomatic invariants");
  } catch (err) {
    reportFail("Test 1: Engine initialization failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Precondition Bounding on Hop TTL (Daf al-Tasalsul)
  // --------------------------------------------------------------------------
  try {
    let threw = false;
    try {
      new SovereignMeshConsensus({
        ...configuration,
        maximumGossipHopTtl: 32, // Exceeds absolute max 16
      });
    } catch (err) {
      assert(err instanceof ConsensusPreconditionError);
      threw = true;
    }
    assert(threw, "Expected ConsensusPreconditionError on hop TTL > 16");
    reportPass("Test 2: Rejection of unbounded hop TTL (> 16 hops) upholds Daf al-Tasalsul");
  } catch (err) {
    reportFail("Test 2: Failed hop TTL bound verification", err);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Monotonic Deadlock-Free Lock Acquisition (Daf al-Dawr)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    const peerZ = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const peerA = "0000000000000000000000000000000000000000000000000000000000000001";
    const peerM = "8888888888888888888888888888888888888888888888888888888888888888";

    // Register peers prior to locking (Qiyas Burhani precondition)
    engine.registerPeerNode({ publicKeyHex: peerZ, networkEndpoint: "127.0.0.1:8001", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peerA, networkEndpoint: "127.0.0.1:8002", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peerM, networkEndpoint: "127.0.0.1:8003", lamportClock: 0 });

    // Acquire in reverse/unordered order
    engine.acquirePeerLocksMonotonically([peerZ, peerA, peerM]);
    assert.strictEqual(engine.currentlyHeldPeerLockCount(), 3);

    // Release monotonically
    engine.releasePeerLocksMonotonically([peerZ, peerA, peerM]);
    assert.strictEqual(engine.currentlyHeldPeerLockCount(), 0);
    reportPass("Test 3: Unordered multi-peer lock requests acquired monotonically without deadlock (Daf al-Dawr)");
  } catch (err) {
    reportFail("Test 3: Monotonic lock test failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Directed Acyclic Graph (DAG) Route & Loop Prevention (Daf al-Dawr)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    const nodeA = "1111111111111111111111111111111111111111111111111111111111111111";
    const nodeB = "2222222222222222222222222222222222222222222222222222222222222222";
    const nodeC = "3333333333333333333333333333333333333333333333333333333333333333";

    engine.registerPeerNode({ publicKeyHex: nodeA, networkEndpoint: "127.0.0.1:5001", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: nodeB, networkEndpoint: "127.0.0.1:5002", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: nodeC, networkEndpoint: "127.0.0.1:5003", lamportClock: 0 });

    engine.registerDirectedMeshEdge(nodeA, nodeB);
    engine.registerDirectedMeshEdge(nodeB, nodeC);

    // Attempting cyclic edge C -> A must be blocked by DAG invariant
    let cyclicThrew = false;
    try {
      engine.registerDirectedMeshEdge(nodeC, nodeA);
    } catch (err) {
      assert(err instanceof MeshRoutingCycleError);
      cyclicThrew = true;
    }
    assert(cyclicThrew, "Expected MeshRoutingCycleError when adding cyclic edge C -> A");
    reportPass("Test 4: Cyclic routing edges rejected immediately, preserving DAG topology");
  } catch (err) {
    reportFail("Test 4: DAG loop prevention failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Bounded Gossip Deduplication & TTL Decrement (Daf al-Tasalsul)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    const originNode = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const relayNode = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    engine.registerPeerNode({ publicKeyHex: originNode, networkEndpoint: "127.0.0.1:6001", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: relayNode, networkEndpoint: "127.0.0.1:6002", lamportClock: 0 });
    engine.registerDirectedMeshEdge(originNode, relayNode);

    const testEnvelope = {
      envelopeIdentifier: "env-unique-alpha-001",
      payload: {
        topicIdentifier: "mesh.consensus.blocks",
        payloadBytes: Buffer.from("sovereign-block-payload-001"),
        originPublicKeyHex: originNode,
        emittedAtEpochMillis: Date.now(),
      },
      remainingHopTtl: 5,
      routingPath: {
        traversedPeerKeyHexes: [originNode],
        pathHashHex: "0000000000000000000000000000000000000000000000000000000000000000",
      },
      replicationFanout: 2,
    };

    // First dispatch succeeds
    const outcome1 = engine.dispatchGossipEnvelope(originNode, testEnvelope.payload, testEnvelope.envelopeIdentifier);
    assert.strictEqual(outcome1.dispatchedEnvelopeIdentifiers.length, 1);
    assert.strictEqual(outcome1.suppressedDuplicateEnvelopeIdentifiers.length, 0);

    // Second dispatch with same ID is deduplicated
    const outcome2 = engine.dispatchGossipEnvelope(originNode, testEnvelope.payload, testEnvelope.envelopeIdentifier);
    assert.strictEqual(outcome2.dispatchedEnvelopeIdentifiers.length, 0);
    assert.strictEqual(outcome2.suppressedDuplicateEnvelopeIdentifiers.length, 1);
    assert.strictEqual(engine.currentDeduplicationCacheEntryCount(), 2); // 1 per hop path vector

    reportPass("Test 5: Gossip duplication bounded by LRU cache with zero redundant forwards");
  } catch (err) {
    reportFail("Test 5: Gossip deduplication failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Byzantine Quorum Consensus Lifecycle (Adam al-Tanaqud)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    const peer1 = "1000000000000000000000000000000000000000000000000000000000000001";
    const peer2 = "2000000000000000000000000000000000000000000000000000000000000002";
    const peer3 = "3000000000000000000000000000000000000000000000000000000000000003";

    engine.registerPeerNode({ publicKeyHex: peer1, networkEndpoint: "127.0.0.1:7001", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peer2, networkEndpoint: "127.0.0.1:7002", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peer3, networkEndpoint: "127.0.0.1:7003", lamportClock: 0 });

    const proposalHash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    // Open epoch 1
    const epochRecord1 = engine.openConsensusEpoch(1, proposalHash);
    assert.strictEqual(epochRecord1.state, ConsensusEpochState.PROPOSING);

    // Transition to voting
    const votingRecord = engine.transitionEpochToVoting(1);
    assert.strictEqual(votingRecord.state, ConsensusEpochState.VOTING);

    // Submit valid ballots (need 2/3 = 2 out of 3 peers)
    engine.submitConsensusVoteBallot({
      epochNumber: 1,
      voterPublicKeyHex: peer1,
      proposedValueHashHex: proposalHash,
      lamportTimestamp: 10,
      ballotSignatureHex: "sig-peer-1",
    });

    engine.submitConsensusVoteBallot({
      epochNumber: 1,
      voterPublicKeyHex: peer2,
      proposedValueHashHex: proposalHash,
      lamportTimestamp: 12,
      ballotSignatureHex: "sig-peer-2",
    });

    // Finalize epoch: quorum reached -> COMMITTED
    const finalizedRecord = engine.finalizeConsensusEpoch(1);
    assert.strictEqual(finalizedRecord.state, ConsensusEpochState.COMMITTED);
    assert.strictEqual(finalizedRecord.committedValueHashHex, proposalHash);

    reportPass("Test 6: Byzantine quorum reached (2/3) and epoch transitioned to COMMITTED atomically");
  } catch (err) {
    reportFail("Test 6: Consensus quorum test failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Quorum Rejection on Insufficient Votes (Adam al-Tanaqud)
  // --------------------------------------------------------------------------
  try {
    const engine = new SovereignMeshConsensus(configuration);
    const peer1 = "1000000000000000000000000000000000000000000000000000000000000001";
    const peer2 = "2000000000000000000000000000000000000000000000000000000000000002";
    const peer3 = "3000000000000000000000000000000000000000000000000000000000000003";

    engine.registerPeerNode({ publicKeyHex: peer1, networkEndpoint: "127.0.0.1:7001", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peer2, networkEndpoint: "127.0.0.1:7002", lamportClock: 0 });
    engine.registerPeerNode({ publicKeyHex: peer3, networkEndpoint: "127.0.0.1:7003", lamportClock: 0 });

    const proposalHash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    engine.openConsensusEpoch(2, proposalHash);
    engine.transitionEpochToVoting(2);

    // Only 1 vote submitted (needs 2 for quorum)
    engine.submitConsensusVoteBallot({
      epochNumber: 2,
      voterPublicKeyHex: peer1,
      proposedValueHashHex: proposalHash,
      lamportTimestamp: 15,
      ballotSignatureHex: "sig-peer-1",
    });

    const rejectedRecord = engine.finalizeConsensusEpoch(2);
    assert.strictEqual(rejectedRecord.state, ConsensusEpochState.QUORUM_REJECTED);
    assert.strictEqual(rejectedRecord.committedValueHashHex, null);

    reportPass("Test 7: Insufficient quorum transitions epoch to QUORUM_REJECTED with zero state contradiction");
  } catch (err) {
    reportFail("Test 7: Quorum rejection test failed", err);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Ibn Manzur Error Taxonomy Rigor
  // --------------------------------------------------------------------------
  try {
    const errorInstance = new ConsensusDeadlockViolationError(
      "Cyclic acquisition sequence detected",
      { heldLockCount: 2, attemptedPeerKeyHex: "deadlock-key" }
    );
    assert(errorInstance instanceof SovereignMeshError);
    assert(errorInstance instanceof Error);
    assert.strictEqual(errorInstance.name, "ConsensusDeadlockViolationError");
    assert(errorInstance.occurredAtEpochMillis > 0);
    assert.strictEqual(errorInstance.causalContext.heldLockCount, 2);
    reportPass("Test 8: Ibn Manzur typed error hierarchy preserves diagnostic causal context and timestamps");
  } catch (err) {
    reportFail("Test 8: Error taxonomy test failed", err);
  }

  console.log("------------------------------------------------------------------");
  console.log(`Results: ${passCount} PASSED, ${failCount} FAILED.`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution threw unhandled exception:", err);
  process.exit(1);
});
