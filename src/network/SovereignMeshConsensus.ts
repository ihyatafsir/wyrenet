/**
 * Sovereign Mesh Consensus and Deadlock-Free Routing Engine for WyreNet.
 *
 * Epistemic foundations:
 *   - Al-Hadd bi al-Dhatiyyat: every domain entity is defined by its essential attributes.
 *   - Daf' al-Dawr: peer lock acquisition is monotonically ordered by public key hex.
 *   - Daf' al-Tasalsul: gossip TTL, fanout, and dedup cache are strictly bounded.
 *   - 'Adam al-Tanaqud: epoch consensus states are mutually exclusive and atomic.
 *   - Al-Qiyas al-Burhani: every public boundary validates preconditions and throws typed errors.
 */

import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

// ============================================================================
// SECTION 1: Teleological Domain Types (Al-Hadd bi al-Dhatiyyat)
// ============================================================================

export interface PeerNodeIdentifier {
  readonly publicKeyHex: string;
  readonly networkEndpoint: string;
  readonly lamportClock: number;
}

export interface MeshPacketPayload {
  readonly topicIdentifier: string;
  readonly payloadBytes: Uint8Array;
  readonly originPublicKeyHex: string;
  readonly emittedAtEpochMillis: number;
}

export interface RoutingPathVector {
  readonly traversedPeerKeyHexes: ReadonlyArray<string>;
  readonly pathHashHex: string;
}

export enum ConsensusEpochState {
  INITIALIZING = "INITIALIZING",
  PROPOSING = "PROPOSING",
  VOTING = "VOTING",
  COMMITTED = "COMMITTED",
  QUORUM_REJECTED = "QUORUM_REJECTED",
}

export interface GossipPacketEnvelope {
  readonly envelopeIdentifier: string;
  readonly payload: MeshPacketPayload;
  readonly remainingHopTtl: number;
  readonly routingPath: RoutingPathVector;
  readonly replicationFanout: number;
}

export interface ConsensusVoteBallot {
  readonly epochNumber: number;
  readonly voterPublicKeyHex: string;
  readonly proposedValueHashHex: string;
  readonly lamportTimestamp: number;
  readonly ballotSignatureHex: string;
}

export interface ConsensusEpochRecord {
  readonly epochNumber: number;
  readonly state: ConsensusEpochState;
  readonly proposedValueHashHex: string;
  readonly collectedBallots: ReadonlyArray<ConsensusVoteBallot>;
  readonly committedValueHashHex: string | null;
  readonly epochOpenedAtMillis: number;
}

// ============================================================================
// SECTION 2: Ibn Manzur Error Taxonomy
// ============================================================================

export class SovereignMeshError extends Error {
  public readonly errorCode: string;
  public readonly causalContext: Readonly<Record<string, string | number>>;
  public readonly occurredAtEpochMillis: number;

  public constructor(
    errorCode: string,
    diagnosticMessage: string,
    causalContext: Readonly<Record<string, string | number>>,
  ) {
    super(diagnosticMessage);
    this.name = "SovereignMeshError";
    this.errorCode = errorCode;
    this.causalContext = causalContext;
    this.occurredAtEpochMillis = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConsensusDeadlockViolationError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("CONSENSUS_DEADLOCK_VIOLATION", diagnosticMessage, causalContext);
    this.name = "ConsensusDeadlockViolationError";
  }
}

export class MeshHopLimitExceededError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("MESH_HOP_LIMIT_EXCEEDED", diagnosticMessage, causalContext);
    this.name = "MeshHopLimitExceededError";
  }
}

export class EpochDivergenceError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("EPOCH_DIVERGENCE", diagnosticMessage, causalContext);
    this.name = "EpochDivergenceError";
  }
}

export class SignatureVerificationError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("SIGNATURE_VERIFICATION_FAILED", diagnosticMessage, causalContext);
    this.name = "SignatureVerificationError";
  }
}

export class MeshRoutingCycleError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("MESH_ROUTING_CYCLE", diagnosticMessage, causalContext);
    this.name = "MeshRoutingCycleError";
  }
}

export class ConsensusPreconditionError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("CONSENSUS_PRECONDITION_VIOLATION", diagnosticMessage, causalContext);
    this.name = "ConsensusPreconditionError";
  }
}

export class BlockHeaderValidationError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("BLOCK_HEADER_VALIDATION_FAILED", diagnosticMessage, causalContext);
    this.name = "BlockHeaderValidationError";
  }
}

export class QuorumEvaluationError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("QUORUM_EVALUATION_FAILED", diagnosticMessage, causalContext);
    this.name = "QuorumEvaluationError";
  }
}

export class ConsensusStateTransitionError extends SovereignMeshError {
  public constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>) {
    super("CONSENSUS_STATE_TRANSITION_FAILED", diagnosticMessage, causalContext);
    this.name = "ConsensusStateTransitionError";
  }
}

// ============================================================================
// SECTION 3: Bounded LRU Deduplication Cache (Daf' al-Tasalsul)
// ============================================================================

class BoundedLruDeduplicationCache {
  private readonly maximumEntryCapacity: number;
  private readonly insertionOrderedKeys: string[];
  private readonly envelopeIdentifierSet: Set<string>;

  public constructor(maximumEntryCapacity: number) {
    if (!Number.isInteger(maximumEntryCapacity) || maximumEntryCapacity <= 0) {
      throw new ConsensusPreconditionError(
        "BoundedLruDeduplicationCache requires a positive integer capacity",
        { providedCapacity: maximumEntryCapacity },
      );
    }
    this.maximumEntryCapacity = maximumEntryCapacity;
    this.insertionOrderedKeys = [];
    this.envelopeIdentifierSet = new Set<string>();
  }

  public hasSeenEnvelope(envelopeIdentifier: string): boolean {
    if (this.envelopeIdentifierSet.has(envelopeIdentifier)) {
      const existingIndex = this.insertionOrderedKeys.indexOf(envelopeIdentifier);
      if (existingIndex >= 0) {
        this.insertionOrderedKeys.splice(existingIndex, 1);
      }
      this.insertionOrderedKeys.push(envelopeIdentifier);
      return true;
    }
    return false;
  }

  public recordEnvelope(envelopeIdentifier: string): void {
    if (this.envelopeIdentifierSet.has(envelopeIdentifier)) {
      const existingIndex = this.insertionOrderedKeys.indexOf(envelopeIdentifier);
      if (existingIndex >= 0) {
        this.insertionOrderedKeys.splice(existingIndex, 1);
      }
      this.insertionOrderedKeys.push(envelopeIdentifier);
      return;
    }
    this.envelopeIdentifierSet.add(envelopeIdentifier);
    this.insertionOrderedKeys.push(envelopeIdentifier);
    while (this.insertionOrderedKeys.length > this.maximumEntryCapacity) {
      const evictedKey = this.insertionOrderedKeys.shift();
      if (evictedKey !== undefined) {
        this.envelopeIdentifierSet.delete(evictedKey);
      }
    }
  }

  public currentEntryCount(): number {
    return this.envelopeIdentifierSet.size;
  }
}

// ============================================================================
// SECTION 4: Monotonic Peer Lock Registry (Daf' al-Dawr)
// ============================================================================

class MonotonicPeerLockRegistry {
  private readonly heldLockKeyHexSet: Set<string> = new Set<string>();
  private readonly lockAcquisitionOrder: string[] = [];

  public acquireLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void {
    if (peerPublicKeyHexes.length === 0) {
      return;
    }
    const sortedUniqueKeys = Array.from(new Set(peerPublicKeyHexes)).sort((leftKey, rightKey) =>
      leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0,
    );

    for (const candidateKeyHex of sortedUniqueKeys) {
      if (this.heldLockKeyHexSet.has(candidateKeyHex)) {
        throw new ConsensusDeadlockViolationError(
          "Attempted to re-acquire an already held peer lock",
          { conflictingPeerKeyHex: candidateKeyHex },
        );
      }
    }

    for (let index = 0; index < sortedUniqueKeys.length; index += 1) {
      const currentKeyHex = sortedUniqueKeys[index];
      if (index > 0) {
        const previousKeyHex = sortedUniqueKeys[index - 1];
        if (previousKeyHex >= currentKeyHex) {
          throw new ConsensusDeadlockViolationError(
            "Peer lock acquisition order is not strictly monotonic",
            { previousPeerKeyHex: previousKeyHex, currentPeerKeyHex: currentKeyHex },
          );
        }
      }
      this.heldLockKeyHexSet.add(currentKeyHex);
      this.lockAcquisitionOrder.push(currentKeyHex);
    }
  }

  public releaseLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void {
    const sortedUniqueKeys = Array.from(new Set(peerPublicKeyHexes)).sort((leftKey, rightKey) =>
      leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0,
    );
    for (let index = sortedUniqueKeys.length - 1; index >= 0; index -= 1) {
      const currentKeyHex = sortedUniqueKeys[index];
      if (!this.heldLockKeyHexSet.has(currentKeyHex)) {
        throw new ConsensusDeadlockViolationError(
          "Attempted to release a peer lock that is not held",
          { missingPeerKeyHex: currentKeyHex },
        );
      }
      this.heldLockKeyHexSet.delete(currentKeyHex);
      const orderIndex = this.lockAcquisitionOrder.lastIndexOf(currentKeyHex);
      if (orderIndex >= 0) {
        this.lockAcquisitionOrder.splice(orderIndex, 1);
      }
    }
  }

  public currentlyHeldLockCount(): number {
    return this.heldLockKeyHexSet.size;
  }
}

// ============================================================================
// SECTION 5: DAG Mesh Routing Table (Daf' al-Dawr)
// ============================================================================

class DirectedAcyclicMeshRoutingTable {
  private readonly adjacencyByPeerKeyHex: Map<string, Set<string>> = new Map<string, Set<string>>();

  public registerPeerNode(peerPublicKeyHex: string): void {
    if (!this.adjacencyByPeerKeyHex.has(peerPublicKeyHex)) {
      this.adjacencyByPeerKeyHex.set(peerPublicKeyHex, new Set<string>());
    }
  }

  public registerDirectedEdge(fromPeerKeyHex: string, toPeerKeyHex: string): void {
    if (fromPeerKeyHex === toPeerKeyHex) {
      throw new MeshRoutingCycleError(
        "Self-loop edges are forbidden in the mesh DAG",
        { peerKeyHex: fromPeerKeyHex },
      );
    }
    this.registerPeerNode(fromPeerKeyHex);
    this.registerPeerNode(toPeerKeyHex);
    const outgoingSet = this.adjacencyByPeerKeyHex.get(fromPeerKeyHex);
    if (outgoingSet === undefined) {
      throw new MeshRoutingCycleError(
        "Adjacency set missing after registration",
        { fromPeerKeyHex },
      );
    }
    outgoingSet.add(toPeerKeyHex);
    if (this.wouldIntroduceCycle(fromPeerKeyHex, toPeerKeyHex)) {
      outgoingSet.delete(toPeerKeyHex);
      throw new MeshRoutingCycleError(
        "Edge would introduce a cycle in the mesh DAG",
        { fromPeerKeyHex, toPeerKeyHex },
      );
    }
  }

  private wouldIntroduceCycle(fromPeerKeyHex: string, toPeerKeyHex: string): boolean {
    const visitedPeerKeyHexSet = new Set<string>();
    const pendingPeerKeyHexStack: string[] = [toPeerKeyHex];
    while (pendingPeerKeyHexStack.length > 0) {
      const currentPeerKeyHex = pendingPeerKeyHexStack.pop();
      if (currentPeerKeyHex === undefined) {
        break;
      }
      if (currentPeerKeyHex === fromPeerKeyHex) {
        return true;
      }
      if (visitedPeerKeyHexSet.has(currentPeerKeyHex)) {
        continue;
      }
      visitedPeerKeyHexSet.add(currentPeerKeyHex);
      const outgoingSet = this.adjacencyByPeerKeyHex.get(currentPeerKeyHex);
      if (outgoingSet !== undefined) {
        outgoingSet.forEach((nextPeerKeyHex) => {
          pendingPeerKeyHexStack.push(nextPeerKeyHex);
        });
      }
    }
    return false;
  }

  public outgoingNeighborsOf(peerPublicKeyHex: string): ReadonlyArray<string> {
    const outgoingSet = this.adjacencyByPeerKeyHex.get(peerPublicKeyHex);
    if (outgoingSet === undefined) {
      return [];
    }
    return Array.from(outgoingSet).sort((leftKey, rightKey) =>
      leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0,
    );
  }

  public hasPeerNode(peerPublicKeyHex: string): boolean {
    return this.adjacencyByPeerKeyHex.has(peerPublicKeyHex);
  }
}

// ============================================================================
// SECTION 6: Deterministic Path Hashing (Sibawayh - strict governance)
// ============================================================================

function computeDeterministicPathHashHex(traversedPeerKeyHexes: ReadonlyArray<string>): string {
  let rollingHash = 0x811c9dc5;
  for (const peerKeyHex of traversedPeerKeyHexes) {
    for (let characterIndex = 0; characterIndex < peerKeyHex.length; characterIndex += 1) {
      rollingHash ^= peerKeyHex.charCodeAt(characterIndex);
      rollingHash = Math.imul(rollingHash, 0x01000193) >>> 0;
    }
    rollingHash ^= 0x7c;
    rollingHash = Math.imul(rollingHash, 0x01000193) >>> 0;
  }
  return rollingHash.toString(16).padStart(8, "0");
}

// ============================================================================
// SECTION 7: Merkle Root Calculator (Al-Farahidi atomic decomposition)
// ============================================================================

class MerkleRootCalculator {
  public static isLowercaseHexDigest(candidateHex: string): boolean {
    if (candidateHex.length !== 64) {
      return false;
    }
    for (let characterIndex = 0; characterIndex < candidateHex.length; characterIndex += 1) {
      const characterCode = candidateHex.charCodeAt(characterIndex);
      const isDigit = characterCode >= 0x30 && characterCode <= 0x39;
      const isLowercaseHexLetter = characterCode >= 0x61 && characterCode <= 0x66;
      if (!isDigit && !isLowercaseHexLetter) {
        return false;
      }
    }
    return true;
  }

  public static computeMerkleRootHex(leafHashHexValues: ReadonlyArray<string>): string {
    if (leafHashHexValues.length === 0) {
      throw new ConsensusPreconditionError(
        "Cannot compute a Merkle root over an empty leaf set",
        { leafCount: leafHashHexValues.length },
      );
    }
    for (let leafIndex = 0; leafIndex < leafHashHexValues.length; leafIndex += 1) {
      const leafHashHex = leafHashHexValues[leafIndex];
      if (!MerkleRootCalculator.isLowercaseHexDigest(leafHashHex)) {
        throw new ConsensusPreconditionError(
          "Merkle leaf must be a lowercase 64-character hexadecimal SHA-256 digest",
          { leafIndex, leafHashHex },
        );
      }
    }
    let currentLevelHashHexValues: string[] = leafHashHexValues.slice();
    while (currentLevelHashHexValues.length > 1) {
      const nextLevelHashHexValues: string[] = [];
      for (
        let pairStartIndex = 0;
        pairStartIndex < currentLevelHashHexValues.length;
        pairStartIndex += 2
      ) {
        const leftHashHex = currentLevelHashHexValues[pairStartIndex];
        const rightHashHex =
          pairStartIndex + 1 < currentLevelHashHexValues.length
            ? currentLevelHashHexValues[pairStartIndex + 1]
            : leftHashHex;
        const concatenatedBytes = Buffer.concat([
          Buffer.from(leftHashHex, "hex"),
          Buffer.from(rightHashHex, "hex"),
        ]);
        const parentDigestBytes = createHash("sha256").update(concatenatedBytes).digest();
        nextLevelHashHexValues.push(parentDigestBytes.toString("hex"));
      }
      currentLevelHashHexValues = nextLevelHashHexValues;
    }
    return currentLevelHashHexValues[0];
  }
}

// ============================================================================
// SECTION 8: SovereignMeshConsensus Engine
// ============================================================================

export interface SovereignMeshConsensusConfiguration {
  readonly maximumGossipHopTtl: number;
  readonly deterministicReplicationFanout: number;
  readonly maximumDeduplicationCacheEntries: number;
  readonly quorumThresholdNumerator: number;
  readonly quorumThresholdDenominator: number;
  readonly maximumEpochDurationMillis: number;
}

export interface GossipDispatchOutcome {
  readonly dispatchedEnvelopeIdentifiers: ReadonlyArray<string>;
  readonly suppressedDuplicateEnvelopeIdentifiers: ReadonlyArray<string>;
  readonly terminatedEnvelopeIdentifiers: ReadonlyArray<string>;
}

export class SovereignMeshConsensus {
  public static readonly ABSOLUTE_MAXIMUM_GOSSIP_HOP_TTL: number = 16;
  public static readonly ABSOLUTE_MAXIMUM_DEDUPLICATION_CACHE_ENTRIES: number = 10000;

  private readonly configuration: SovereignMeshConsensusConfiguration;
  private readonly peerLockRegistry: MonotonicPeerLockRegistry;
  private readonly meshRoutingTable: DirectedAcyclicMeshRoutingTable;
  private readonly deduplicationCache: BoundedLruDeduplicationCache;
  private readonly epochRecordsByNumber: Map<number, ConsensusEpochRecord>;
  private readonly registeredPeerNodes: Map<string, PeerNodeIdentifier>;
  private lamportClockCounter: number;

  public constructor(configuration: SovereignMeshConsensusConfiguration) {
    if (!Number.isInteger(configuration.maximumGossipHopTtl) || configuration.maximumGossipHopTtl <= 0) {
      throw new ConsensusPreconditionError(
        "maximumGossipHopTtl must be a positive integer",
        { providedValue: configuration.maximumGossipHopTtl },
      );
    }
    if (configuration.maximumGossipHopTtl > SovereignMeshConsensus.ABSOLUTE_MAXIMUM_GOSSIP_HOP_TTL) {
      throw new ConsensusPreconditionError(
        "maximumGossipHopTtl exceeds the absolute bound of 16 hops",
        { providedValue: configuration.maximumGossipHopTtl },
      );
    }
    if (!Number.isInteger(configuration.deterministicReplicationFanout) || configuration.deterministicReplicationFanout <= 0) {
      throw new ConsensusPreconditionError(
        "deterministicReplicationFanout must be a positive integer",
        { providedValue: configuration.deterministicReplicationFanout },
      );
    }
    if (!Number.isInteger(configuration.maximumDeduplicationCacheEntries) || configuration.maximumDeduplicationCacheEntries <= 0) {
      throw new ConsensusPreconditionError(
        "maximumDeduplicationCacheEntries must be a positive integer",
        { providedValue: configuration.maximumDeduplicationCacheEntries },
      );
    }
    if (configuration.maximumDeduplicationCacheEntries > SovereignMeshConsensus.ABSOLUTE_MAXIMUM_DEDUPLICATION_CACHE_ENTRIES) {
      throw new ConsensusPreconditionError(
        "maximumDeduplicationCacheEntries exceeds the absolute bound of 10000 entries",
        { providedValue: configuration.maximumDeduplicationCacheEntries },
      );
    }
    if (
      !Number.isInteger(configuration.quorumThresholdNumerator) ||
      !Number.isInteger(configuration.quorumThresholdDenominator) ||
      configuration.quorumThresholdNumerator <= 0 ||
      configuration.quorumThresholdDenominator <= 0 ||
      configuration.quorumThresholdNumerator > configuration.quorumThresholdDenominator
    ) {
      throw new ConsensusPreconditionError(
        "quorum threshold must be a valid fraction in (0, 1]",
        {
          numerator: configuration.quorumThresholdNumerator,
          denominator: configuration.quorumThresholdDenominator,
        },
      );
    }
    if (!Number.isInteger(configuration.maximumEpochDurationMillis) || configuration.maximumEpochDurationMillis <= 0) {
      throw new ConsensusPreconditionError(
        "maximumEpochDurationMillis must be a positive integer",
        { providedValue: configuration.maximumEpochDurationMillis },
      );
    }

    this.configuration = configuration;
    this.peerLockRegistry = new MonotonicPeerLockRegistry();
    this.meshRoutingTable = new DirectedAcyclicMeshRoutingTable();
    this.deduplicationCache = new BoundedLruDeduplicationCache(configuration.maximumDeduplicationCacheEntries);
    this.epochRecordsByNumber = new Map<number, ConsensusEpochRecord>();
    this.registeredPeerNodes = new Map<string, PeerNodeIdentifier>();
    this.lamportClockCounter = 0;
  }

  // --------------------------------------------------------------------------
  // Peer registration and mesh topology
  // --------------------------------------------------------------------------

  public registerPeerNode(peerNodeIdentifier: PeerNodeIdentifier): void {
    if (peerNodeIdentifier.publicKeyHex.length === 0) {
      throw new ConsensusPreconditionError(
        "Peer public key hex must be non-empty",
        { networkEndpoint: peerNodeIdentifier.networkEndpoint },
      );
    }
    if (peerNodeIdentifier.networkEndpoint.length === 0) {
      throw new ConsensusPreconditionError(
        "Peer network endpoint must be non-empty",
        { publicKeyHex: peerNodeIdentifier.publicKeyHex },
      );
    }
    if (peerNodeIdentifier.lamportClock < 0) {
      throw new ConsensusPreconditionError(
        "Peer lamport clock must be non-negative",
        { publicKeyHex: peerNodeIdentifier.publicKeyHex, lamportClock: peerNodeIdentifier.lamportClock },
      );
    }
    this.registeredPeerNodes.set(peerNodeIdentifier.publicKeyHex, peerNodeIdentifier);
    this.meshRoutingTable.registerPeerNode(peerNodeIdentifier.publicKeyHex);
    this.advanceLamportClock(peerNodeIdentifier.lamportClock);
  }

  public registerDirectedMeshEdge(fromPeerKeyHex: string, toPeerKeyHex: string): void {
    if (!this.registeredPeerNodes.has(fromPeerKeyHex)) {
      throw new ConsensusPreconditionError(
        "Source peer is not registered",
        { fromPeerKeyHex },
      );
    }
    if (!this.registeredPeerNodes.has(toPeerKeyHex)) {
      throw new ConsensusPreconditionError(
        "Destination peer is not registered",
        { toPeerKeyHex },
      );
    }
    this.meshRoutingTable.registerDirectedEdge(fromPeerKeyHex, toPeerKeyHex);
  }

  private advanceLamportClock(observedLamportClock: number): number {
    if (observedLamportClock > this.lamportClockCounter) {
      this.lamportClockCounter = observedLamportClock;
    }
    this.lamportClockCounter += 1;
    return this.lamportClockCounter;
  }

  public currentLamportClock(): number {
    return this.lamportClockCounter;
  }

  // --------------------------------------------------------------------------
  // Monotonic peer lock acquisition (Daf' al-Dawr)
  // --------------------------------------------------------------------------

  public acquirePeerLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void {
    for (const peerKeyHex of peerPublicKeyHexes) {
      if (!this.registeredPeerNodes.has(peerKeyHex)) {
        throw new ConsensusPreconditionError(
          "Cannot lock an unregistered peer",
          { peerKeyHex },
        );
      }
    }
    this.peerLockRegistry.acquireLocksMonotonically(peerPublicKeyHexes);
  }

  public releasePeerLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void {
    this.peerLockRegistry.releaseLocksMonotonically(peerPublicKeyHexes);
  }

  public currentlyHeldPeerLockCount(): number {
    return this.peerLockRegistry.currentlyHeldLockCount();
  }

  // --------------------------------------------------------------------------
  // Bounded gossip dispatch (Daf' al-Tasalsul)
  // --------------------------------------------------------------------------

  public dispatchGossipEnvelope(
    originPeerKeyHex: string,
    payload: MeshPacketPayload,
    envelopeIdentifier: string,
  ): GossipDispatchOutcome {
    if (!this.registeredPeerNodes.has(originPeerKeyHex)) {
      throw new ConsensusPreconditionError(
        "Gossip origin peer is not registered",
        { originPeerKeyHex },
      );
    }
    if (envelopeIdentifier.length === 0) {
      throw new ConsensusPreconditionError(
        "Gossip envelope identifier must be non-empty",
        { originPeerKeyHex },
      );
    }
    if (payload.payloadBytes.length === 0) {
      throw new ConsensusPreconditionError(
        "Gossip payload bytes must be non-empty",
        { envelopeIdentifier },
      );
    }
    if (payload.originPublicKeyHex !== originPeerKeyHex) {
      throw new ConsensusPreconditionError(
        "Payload origin does not match gossip origin peer",
        { payloadOrigin: payload.originPublicKeyHex, gossipOrigin: originPeerKeyHex },
      );
    }

    const initialRoutingPath: RoutingPathVector = {
      traversedPeerKeyHexes: [originPeerKeyHex],
      pathHashHex: computeDeterministicPathHashHex([originPeerKeyHex]),
    };

    const initialEnvelope: GossipPacketEnvelope = {
      envelopeIdentifier,
      payload,
      remainingHopTtl: this.configuration.maximumGossipHopTtl,
      routingPath: initialRoutingPath,
      replicationFanout: this.configuration.deterministicReplicationFanout,
    };

    const dispatchedEnvelopeIdentifiers: string[] = [];
    const suppressedDuplicateEnvelopeIdentifiers: string[] = [];
    const terminatedEnvelopeIdentifiers: string[] = [];

    const pendingEnvelopeQueue: GossipPacketEnvelope[] = [initialEnvelope];
    let processedEnvelopeCount = 0;
    const maximumProcessedEnvelopeCount =
      this.configuration.maximumGossipHopTtl *
      this.configuration.deterministicReplicationFanout *
      Math.max(1, this.registeredPeerNodes.size);

    while (pendingEnvelopeQueue.length > 0) {
      if (processedEnvelopeCount >= maximumProcessedEnvelopeCount) {
        throw new MeshHopLimitExceededError(
          "Gossip dispatch exceeded the deterministic processing horizon",
          {
            processedEnvelopeCount,
            maximumProcessedEnvelopeCount,
            envelopeIdentifier,
          },
        );
      }
      processedEnvelopeCount += 1;

      const currentEnvelope = pendingEnvelopeQueue.shift();
      if (currentEnvelope === undefined) {
        break;
      }

      const deduplicationKey = `${currentEnvelope.envelopeIdentifier}::${currentEnvelope.routingPath.pathHashHex}`;
      if (this.deduplicationCache.hasSeenEnvelope(deduplicationKey)) {
        suppressedDuplicateEnvelopeIdentifiers.push(currentEnvelope.envelopeIdentifier);
        continue;
      }
      this.deduplicationCache.recordEnvelope(deduplicationKey);

      if (currentEnvelope.remainingHopTtl <= 0) {
        terminatedEnvelopeIdentifiers.push(currentEnvelope.envelopeIdentifier);
        continue;
      }

      const currentPeerKeyHex =
        currentEnvelope.routingPath.traversedPeerKeyHexes[
          currentEnvelope.routingPath.traversedPeerKeyHexes.length - 1
        ];
      if (currentPeerKeyHex === undefined) {
        throw new MeshRoutingCycleError(
          "Routing path vector is empty during gossip dispatch",
          { envelopeIdentifier: currentEnvelope.envelopeIdentifier },
        );
      }

      const outgoingNeighborKeys = this.meshRoutingTable.outgoingNeighborsOf(currentPeerKeyHex);
      const selectedNeighborKeys = outgoingNeighborKeys.slice(0, currentEnvelope.replicationFanout);

      if (selectedNeighborKeys.length === 0) {
        terminatedEnvelopeIdentifiers.push(currentEnvelope.envelopeIdentifier);
        continue;
      }

      dispatchedEnvelopeIdentifiers.push(currentEnvelope.envelopeIdentifier);

      for (const neighborPeerKeyHex of selectedNeighborKeys) {
        if (currentEnvelope.routingPath.traversedPeerKeyHexes.includes(neighborPeerKeyHex)) {
          throw new MeshRoutingCycleError(
            "Gossip forwarding would revisit an already traversed peer",
            {
              envelopeIdentifier: currentEnvelope.envelopeIdentifier,
              revisitedPeerKeyHex: neighborPeerKeyHex,
            },
          );
        }
        const extendedTraversal = [
          ...currentEnvelope.routingPath.traversedPeerKeyHexes,
          neighborPeerKeyHex,
        ];
        const extendedRoutingPath: RoutingPathVector = {
          traversedPeerKeyHexes: extendedTraversal,
          pathHashHex: computeDeterministicPathHashHex(extendedTraversal),
        };
        const forwardedEnvelope: GossipPacketEnvelope = {
          envelopeIdentifier: currentEnvelope.envelopeIdentifier,
          payload: currentEnvelope.payload,
          remainingHopTtl: currentEnvelope.remainingHopTtl - 1,
          routingPath: extendedRoutingPath,
          replicationFanout: currentEnvelope.replicationFanout,
        };
        pendingEnvelopeQueue.push(forwardedEnvelope);
      }
    }

    return {
      dispatchedEnvelopeIdentifiers,
      suppressedDuplicateEnvelopeIdentifiers,
      terminatedEnvelopeIdentifiers,
    };
  }

  public currentDeduplicationCacheEntryCount(): number {
    return this.deduplicationCache.currentEntryCount();
  }

  // --------------------------------------------------------------------------
  // Epoch consensus ('Adam al-Tanaqud)
  // --------------------------------------------------------------------------

  public openConsensusEpoch(epochNumber: number, proposedValueHashHex: string): ConsensusEpochRecord {
    if (!Number.isInteger(epochNumber) || epochNumber < 0) {
      throw new ConsensusPreconditionError(
        "Epoch number must be a non-negative integer",
        { providedEpochNumber: epochNumber },
      );
    }
    if (proposedValueHashHex.length === 0) {
      throw new ConsensusPreconditionError(
        "Proposed value hash must be non-empty",
        { epochNumber },
      );
    }
    if (this.epochRecordsByNumber.has(epochNumber)) {
      throw new EpochDivergenceError(
        "Epoch number is already registered",
        { epochNumber },
      );
    }
    const epochRecord: ConsensusEpochRecord = {
      epochNumber,
      state: ConsensusEpochState.PROPOSING,
      proposedValueHashHex,
      collectedBallots: [],
      committedValueHashHex: null,
      epochOpenedAtMillis: Date.now(),
    };
    this.epochRecordsByNumber.set(epochNumber, epochRecord);
    this.advanceLamportClock(0);
    return epochRecord;
  }

  public transitionEpochToVoting(epochNumber: number): ConsensusEpochRecord {
    const currentRecord = this.requireEpochRecord(epochNumber);
    if (currentRecord.state !== ConsensusEpochState.PROPOSING) {
      throw new EpochDivergenceError(
        "Epoch can only transition to VOTING from PROPOSING",
        { epochNumber, currentState: currentRecord.state },
      );
    }
    const updatedRecord: ConsensusEpochRecord = {
      ...currentRecord,
      state: ConsensusEpochState.VOTING,
    };
    this.epochRecordsByNumber.set(epochNumber, updatedRecord);
    return updatedRecord;
  }

  public submitConsensusVoteBallot(ballot: ConsensusVoteBallot): ConsensusEpochRecord {
    if (!Number.isInteger(ballot.epochNumber) || ballot.epochNumber < 0) {
      throw new ConsensusPreconditionError(
        "Ballot epoch number must be a non-negative integer",
        { providedEpochNumber: ballot.epochNumber },
      );
    }
    if (ballot.voterPublicKeyHex.length === 0) {
      throw new ConsensusPreconditionError(
        "Ballot voter public key hex must be non-empty",
        { epochNumber: ballot.epochNumber },
      );
    }
    if (!this.registeredPeerNodes.has(ballot.voterPublicKeyHex)) {
      throw new SignatureVerificationError(
        "Ballot voter is not a registered peer",
        { voterPublicKeyHex: ballot.voterPublicKeyHex, epochNumber: ballot.epochNumber },
      );
    }
    if (ballot.ballotSignatureHex.length === 0) {
      throw new SignatureVerificationError(
        "Ballot signature must be non-empty",
        { voterPublicKeyHex: ballot.voterPublicKeyHex, epochNumber: ballot.epochNumber },
      );
    }
    if (ballot.lamportTimestamp < 0) {
      throw new ConsensusPreconditionError(
        "Ballot lamport timestamp must be non-negative",
        { voterPublicKeyHex: ballot.voterPublicKeyHex, lamportTimestamp: ballot.lamportTimestamp },
      );
    }

    const currentRecord = this.requireEpochRecord(ballot.epochNumber);
    if (currentRecord.state !== ConsensusEpochState.VOTING) {
      throw new EpochDivergenceError(
        "Ballots may only be submitted while the epoch is in VOTING state",
        { epochNumber: ballot.epochNumber, currentState: currentRecord.state },
      );
    }
    if (ballot.proposedValueHashHex !== currentRecord.proposedValueHashHex) {
      throw new EpochDivergenceError(
        "Ballot proposed value hash diverges from the epoch proposal",
        {
          epochNumber: ballot.epochNumber,
          ballotValueHash: ballot.proposedValueHashHex,
          epochValueHash: currentRecord.proposedValueHashHex,
        },
      );
    }
    for (const existingBallot of currentRecord.collectedBallots) {
      if (existingBallot.voterPublicKeyHex === ballot.voterPublicKeyHex) {
        throw new EpochDivergenceError(
          "Duplicate ballot from the same voter within an epoch",
          { epochNumber: ballot.epochNumber, voterPublicKeyHex: ballot.voterPublicKeyHex },
        );
      }
    }

    this.advanceLamportClock(ballot.lamportTimestamp);

    const updatedBallots = [...currentRecord.collectedBallots, ballot];
    const updatedRecord: ConsensusEpochRecord = {
      ...currentRecord,
      collectedBallots: updatedBallots,
    };
    this.epochRecordsByNumber.set(ballot.epochNumber, updatedRecord);
    return updatedRecord;
  }

  public finalizeConsensusEpoch(epochNumber: number): ConsensusEpochRecord {
    const currentRecord = this.requireEpochRecord(epochNumber);
    if (currentRecord.state !== ConsensusEpochState.VOTING) {
      throw new EpochDivergenceError(
        "Epoch can only be finalized from VOTING state",
        { epochNumber, currentState: currentRecord.state },
      );
    }

    const totalRegisteredPeerCount = this.registeredPeerNodes.size;
    if (totalRegisteredPeerCount === 0) {
      throw new ConsensusPreconditionError(
        "Cannot finalize an epoch with zero registered peers",
        { epochNumber },
      );
    }

    const requiredQuorumCount = Math.ceil(
      (totalRegisteredPeerCount * this.configuration.quorumThresholdNumerator) /
        this.configuration.quorumThresholdDenominator,
    );

    const distinctVoterKeyHexSet = new Set<string>();
    for (const ballot of currentRecord.collectedBallots) {
      distinctVoterKeyHexSet.add(ballot.voterPublicKeyHex);
    }

    if (distinctVoterKeyHexSet.size >= requiredQuorumCount) {
      const committedRecord: ConsensusEpochRecord = {
        ...currentRecord,
        state: ConsensusEpochState.COMMITTED,
        committedValueHashHex: currentRecord.proposedValueHashHex,
      };
      this.epochRecordsByNumber.set(epochNumber, committedRecord);
      return committedRecord;
    }

    const rejectedRecord: ConsensusEpochRecord = {
      ...currentRecord,
      state: ConsensusEpochState.QUORUM_REJECTED,
      committedValueHashHex: null,
    };
    this.epochRecordsByNumber.set(epochNumber, rejectedRecord);
    return rejectedRecord;
  }

  public requireEpochRecord(epochNumber: number): ConsensusEpochRecord {
    const epochRecord = this.epochRecordsByNumber.get(epochNumber);
    if (!epochRecord) {
      throw new EpochDivergenceError(
        "Epoch record not found",
        { epochNumber },
      );
    }
    return epochRecord;
  }



  public getLamportClock(): number {
    return this.lamportClockCounter;
  }

  public getEpochRecord(epochNumber: number): ConsensusEpochRecord | undefined {
    return this.epochRecordsByNumber.get(epochNumber);
  }
}
