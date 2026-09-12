"use strict";
/**
 * نَبْض (NABD) - Pulse Timing System
 *
 * Predictive acknowledgment for BARQ protocol
 * Instead of ACKing every packet, only ACK on mismatch
 *
 * Concept: Sender predicts when receiver got packet based on RTT
 * If receiver didn't get it, they send NACK for retransmit
 * This reduces overhead by ~50% compared to TCP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NABD_RECOVERY_WINDOW = exports.NABD_LOSS_THRESHOLD = exports.NABD_PULSE_INTERVAL = void 0;
exports.initTiming = initTiming;
exports.onReceive = onReceive;
exports.shouldPulse = shouldPulse;
exports.isHealthy = isHealthy;
exports.getGaps = getGaps;
exports.cleanup = cleanup;
// Timing windows (in ms)
exports.NABD_PULSE_INTERVAL = 100; // Heartbeat interval
exports.NABD_LOSS_THRESHOLD = 3; // Pulses before declaring loss
exports.NABD_RECOVERY_WINDOW = 500; // Time to wait for recovery
// Per-connection pulse state
const states = new Map();
/**
 * Initialize timing for a connection
 */
function initTiming(peerId) {
    states.set(peerId, {
        peerId,
        expectedSequence: 0,
        lastPulse: Date.now(),
        missedPulses: 0,
        gaps: new Set(),
        lastReceived: Date.now(),
    });
}
/**
 * Register received sequence, detect gaps
 */
function onReceive(peerId, sequence) {
    const state = states.get(peerId);
    if (!state)
        return [];
    state.lastReceived = Date.now();
    state.missedPulses = 0;
    // Find any gaps
    const nacks = [];
    if (sequence > state.expectedSequence) {
        // Gap detected - some packets were lost
        for (let i = state.expectedSequence; i < sequence; i++) {
            state.gaps.add(i);
            nacks.push(i);
        }
    }
    // Remove from gaps if we got a retransmit
    state.gaps.delete(sequence);
    // Update expected
    state.expectedSequence = Math.max(state.expectedSequence, sequence + 1);
    return nacks;
}
/**
 * Check if we should send a pulse (keep-alive)
 */
function shouldPulse(peerId) {
    const state = states.get(peerId);
    if (!state)
        return false;
    const now = Date.now();
    const elapsed = now - state.lastPulse;
    if (elapsed >= exports.NABD_PULSE_INTERVAL) {
        state.lastPulse = now;
        return true;
    }
    return false;
}
/**
 * Check connection health
 */
function isHealthy(peerId) {
    const state = states.get(peerId);
    if (!state)
        return false;
    const age = Date.now() - state.lastReceived;
    return age < exports.NABD_PULSE_INTERVAL * exports.NABD_LOSS_THRESHOLD;
}
/**
 * Get sequences needing retransmit
 */
function getGaps(peerId) {
    var _a;
    return Array.from(((_a = states.get(peerId)) === null || _a === void 0 ? void 0 : _a.gaps) || []);
}
/**
 * Clean up
 */
function cleanup(peerId) {
    states.delete(peerId);
}
