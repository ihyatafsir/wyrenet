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
export declare enum ConsensusEpochState {
    INITIALIZING = "INITIALIZING",
    PROPOSING = "PROPOSING",
    VOTING = "VOTING",
    COMMITTED = "COMMITTED",
    QUORUM_REJECTED = "QUORUM_REJECTED"
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
export declare class SovereignMeshError extends Error {
    readonly errorCode: string;
    readonly causalContext: Readonly<Record<string, string | number>>;
    readonly occurredAtEpochMillis: number;
    constructor(errorCode: string, diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class ConsensusDeadlockViolationError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class MeshHopLimitExceededError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class EpochDivergenceError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class SignatureVerificationError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class MeshRoutingCycleError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class ConsensusPreconditionError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class BlockHeaderValidationError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class QuorumEvaluationError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
export declare class ConsensusStateTransitionError extends SovereignMeshError {
    constructor(diagnosticMessage: string, causalContext: Readonly<Record<string, string | number>>);
}
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
export declare class SovereignMeshConsensus {
    static readonly ABSOLUTE_MAXIMUM_GOSSIP_HOP_TTL: number;
    static readonly ABSOLUTE_MAXIMUM_DEDUPLICATION_CACHE_ENTRIES: number;
    private readonly configuration;
    private readonly peerLockRegistry;
    private readonly meshRoutingTable;
    private readonly deduplicationCache;
    private readonly epochRecordsByNumber;
    private readonly registeredPeerNodes;
    private lamportClockCounter;
    constructor(configuration: SovereignMeshConsensusConfiguration);
    registerPeerNode(peerNodeIdentifier: PeerNodeIdentifier): void;
    registerDirectedMeshEdge(fromPeerKeyHex: string, toPeerKeyHex: string): void;
    private advanceLamportClock;
    currentLamportClock(): number;
    acquirePeerLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void;
    releasePeerLocksMonotonically(peerPublicKeyHexes: ReadonlyArray<string>): void;
    currentlyHeldPeerLockCount(): number;
    dispatchGossipEnvelope(originPeerKeyHex: string, payload: MeshPacketPayload, envelopeIdentifier: string): GossipDispatchOutcome;
    currentDeduplicationCacheEntryCount(): number;
    openConsensusEpoch(epochNumber: number, proposedValueHashHex: string): ConsensusEpochRecord;
    transitionEpochToVoting(epochNumber: number): ConsensusEpochRecord;
    submitConsensusVoteBallot(ballot: ConsensusVoteBallot): ConsensusEpochRecord;
    finalizeConsensusEpoch(epochNumber: number): ConsensusEpochRecord;
    requireEpochRecord(epochNumber: number): ConsensusEpochRecord;
    getLamportClock(): number;
    getEpochRecord(epochNumber: number): ConsensusEpochRecord | undefined;
}
