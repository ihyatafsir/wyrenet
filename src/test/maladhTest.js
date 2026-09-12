"use strict";
/**
 * اِخْتِبَار المَلَاذ (Ikhtibar al-Maladh) - Maladh Test Suite
 * Tests for all 5 stealth discovery primitives
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMaladhTests = runMaladhTests;
const MaladhDiscovery_1 = __importStar(require("../network/MaladhDiscovery"));
const ShabahStego_1 = require("../network/ShabahStego");
// ═══════════════════════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════════════════════
function createTestBeacon(suffix = '1') {
    return MaladhDiscovery_1.default.createBeacon(`peer_${suffix}@wyresup.test`, `abcdef1234567890abcdef1234567890${suffix}`, [{ type: 'tcp', host: '192.168.1.100', port: 9000, priority: 1 }], 300);
}
// ═══════════════════════════════════════════════════════════════
// Test Runner
// ═══════════════════════════════════════════════════════════════
async function runMaladhTests() {
    var _a;
    const results = [];
    // Ensure engine is fresh
    MaladhDiscovery_1.maladhDiscovery.clearDiscoveredPeers();
    // ─────────────────────────────────────────────────────────
    // Test 1: حَجَر (Hajar) - Dead-Drop Round Trip
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.activate();
        MaladhDiscovery_1.maladhDiscovery.toggleMethod('hajar', true);
        const beacon = createTestBeacon('hajar');
        const config = {
            dropType: 'file',
            location: '/tmp/wyresup_test_drop',
            pollInterval: 10,
            encryptionKey: 'test_secret_key_hajar_2026',
        };
        // Publish
        const dropPayload = MaladhDiscovery_1.maladhDiscovery.hajarPublish(config, beacon);
        const hasPayload = dropPayload.length > 0;
        // Search (retrieve)
        const found = MaladhDiscovery_1.maladhDiscovery.hajarSearch(config, dropPayload);
        const match = (found === null || found === void 0 ? void 0 : found.peerId) === beacon.peerId;
        results.push({
            name: '🪨 حَجَر Dead-Drop Round Trip',
            passed: hasPayload && !!match,
            detail: match
                ? `✓ Beacon round-tripped (${dropPayload.length} chars) — peer ${found === null || found === void 0 ? void 0 : found.peerId.slice(0, 16)}...`
                : `✗ Mismatch: got ${(found === null || found === void 0 ? void 0 : found.peerId) || 'null'}`,
        });
    }
    catch (err) {
        results.push({ name: '🪨 حَجَر Dead-Drop', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 2: حَجَر Paste Format
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('paste');
        const config = {
            dropType: 'paste',
            location: 'https://paste.example.com/abc',
            pollInterval: 30,
            encryptionKey: 'paste_key_xyz',
        };
        const pasteContent = MaladhDiscovery_1.maladhDiscovery.hajarPublish(config, beacon);
        const hasBuildLog = pasteContent.includes('Build Log');
        const found = MaladhDiscovery_1.maladhDiscovery.hajarSearch(config, pasteContent);
        results.push({
            name: '🪨 حَجَر Paste Disguise',
            passed: hasBuildLog && (found === null || found === void 0 ? void 0 : found.peerId) === beacon.peerId,
            detail: hasBuildLog
                ? `✓ Data disguised as CI build log — ${pasteContent.split('\n').length} lines`
                : '✗ Paste format not applied',
        });
    }
    catch (err) {
        results.push({ name: '🪨 حَجَر Paste', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 3: حَجَر DNS TXT Format
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('dns');
        const config = {
            dropType: 'dns',
            location: '_wyresup.example.com',
            pollInterval: 60,
            encryptionKey: 'dns_key_secret',
        };
        const dnsPayload = MaladhDiscovery_1.maladhDiscovery.hajarPublish(config, beacon);
        const hasDnsFormat = dnsPayload.includes('v=wyrspf');
        const found = MaladhDiscovery_1.maladhDiscovery.hajarSearch(config, dnsPayload);
        results.push({
            name: '🪨 حَجَر DNS TXT Format',
            passed: hasDnsFormat && (found === null || found === void 0 ? void 0 : found.peerId) === beacon.peerId,
            detail: hasDnsFormat
                ? `✓ Encoded as ${dnsPayload.split('\n').length} DNS TXT records`
                : '✗ DNS format not applied',
        });
    }
    catch (err) {
        results.push({ name: '🪨 حَجَر DNS TXT', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 4: حَجَر Replay Protection
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('replay');
        const config = {
            dropType: 'file',
            location: '/tmp/replay_test',
            pollInterval: 10,
            encryptionKey: 'replay_key',
        };
        const payload = MaladhDiscovery_1.maladhDiscovery.hajarPublish(config, beacon);
        MaladhDiscovery_1.maladhDiscovery.hajarSearch(config, payload); // First read
        const replay = MaladhDiscovery_1.maladhDiscovery.hajarSearch(config, payload); // Second read
        results.push({
            name: '🪨 حَجَر Replay Protection',
            passed: replay === null,
            detail: replay === null
                ? '✓ Duplicate beacon correctly rejected'
                : '✗ Replay not detected',
        });
    }
    catch (err) {
        results.push({ name: '🪨 حَجَر Replay', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 5: رَمَاد (Ramad) - Timing Signal Round Trip
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.toggleMethod('ramad', true);
        const beacon = createTestBeacon('ramad');
        const delays = MaladhDiscovery_1.maladhDiscovery.ramadEncode(beacon);
        const hasSync = delays[0] === 300 && delays[delays.length - 1] === 300;
        const decoded = MaladhDiscovery_1.maladhDiscovery.ramadDecode(delays);
        results.push({
            name: '🔥 رَمَاد Timing Signal Round Trip',
            passed: hasSync && (decoded === null || decoded === void 0 ? void 0 : decoded.peerId) === beacon.peerId,
            detail: hasSync
                ? `✓ ${delays.length} intervals — sync pulses OK — decoded peer ${decoded === null || decoded === void 0 ? void 0 : decoded.peerId.slice(0, 16)}...`
                : '✗ Sync pulse structure invalid',
        });
    }
    catch (err) {
        results.push({ name: '🔥 رَمَاد Timing', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 6: رَمَاد Noise Tolerance
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('noise');
        const delays = MaladhDiscovery_1.maladhDiscovery.ramadEncode(beacon);
        // Add slight noise (±15ms) within tolerance
        const noisy = delays.map(d => d + (Math.random() * 20 - 10));
        const decoded = MaladhDiscovery_1.maladhDiscovery.ramadDecode(noisy);
        results.push({
            name: '🔥 رَمَاد Noise Tolerance',
            passed: (decoded === null || decoded === void 0 ? void 0 : decoded.peerId) === beacon.peerId,
            detail: decoded
                ? `✓ Decoded correctly despite ±10ms jitter`
                : '✗ Failed to decode with noise',
        });
    }
    catch (err) {
        results.push({ name: '🔥 رَمَاد Noise', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 7: قِنَاع (Qina') - Disguised HTTP Probe
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.toggleMethod('qina', true);
        const beacon = createTestBeacon('qina');
        const probe = MaladhDiscovery_1.maladhDiscovery.qinaCreateProbe(beacon);
        const looksLikeGoogle = probe.url.includes('google.com/search');
        const hasUA = probe.headers['User-Agent'].includes('Mozilla');
        const extracted = MaladhDiscovery_1.maladhDiscovery.qinaExtractProbe(probe.url, probe.headers);
        results.push({
            name: '🎭 قِنَاع Disguised HTTP Probe',
            passed: looksLikeGoogle && (extracted === null || extracted === void 0 ? void 0 : extracted.peerId) === beacon.peerId,
            detail: looksLikeGoogle
                ? `✓ Probe disguised as Google search — extracted peer ${extracted === null || extracted === void 0 ? void 0 : extracted.peerId.slice(0, 16)}...`
                : '✗ Probe doesn\'t look like normal HTTP',
        });
    }
    catch (err) {
        results.push({ name: '🎭 قِنَاع Probe', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 8: دَلِيل (Dalil) - Stego Text Advertisement
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.toggleMethod('dalil', true);
        const beacon = createTestBeacon('dalil');
        const coverText = 'Just had the best coffee this morning! ☕ Nothing beats a fresh brew to start the day. #MondayMotivation #GoodVibes #MorningRoutine. The weather is so nice today, I might just go for a walk later with friends!';
        const stegoText = MaladhDiscovery_1.maladhDiscovery.dalilPublish(beacon, coverText);
        // The visible text should look the same
        const visibleChars = Array.from(stegoText).filter((c) => c.charCodeAt(0) > 0x200F || c.charCodeAt(0) < 0x200B).join('');
        const extracted = MaladhDiscovery_1.maladhDiscovery.dalilExtract(stegoText);
        results.push({
            name: '🧭 دَلِيل Stego Text Ad',
            passed: visibleChars.includes('coffee') && (extracted === null || extracted === void 0 ? void 0 : extracted.peerId) === beacon.peerId,
            detail: extracted
                ? `✓ Hidden beacon in "${coverText.slice(0, 30)}..." — peer ${extracted.peerId.slice(0, 16)}...`
                : '✗ Failed to extract from stego text',
        });
    }
    catch (err) {
        results.push({ name: '🧭 دَلِيل Stego', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 9: دَلِيل Emoji Encoding
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('emoji');
        const emoji = MaladhDiscovery_1.maladhDiscovery.dalilPublishEmoji(beacon);
        const hasEmoji = emoji.length > 0;
        // Decode via shabahStego
        const decoded = ShabahStego_1.shabahStego.decodeFromEmoji(emoji);
        const parsed = decoded ? JSON.parse(decoded) : null;
        results.push({
            name: '🧭 دَلِيل Emoji Encoding',
            passed: hasEmoji && (parsed === null || parsed === void 0 ? void 0 : parsed.i) === beacon.peerId,
            detail: hasEmoji
                ? `✓ ${Array.from(emoji).length} emoji chars — decoded peer ${(_a = parsed === null || parsed === void 0 ? void 0 : parsed.i) === null || _a === void 0 ? void 0 : _a.slice(0, 16)}...`
                : '✗ No emoji output',
        });
    }
    catch (err) {
        results.push({ name: '🧭 دَلِيل Emoji', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 10: دَلِيل Color Palette
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('color');
        const colors = MaladhDiscovery_1.maladhDiscovery.dalilPublishColors(beacon);
        const allHex = colors.every(c => /^#[0-9a-f]{6}$/.test(c));
        // Decode via shabahStego
        const decoded = ShabahStego_1.shabahStego.decodePeerFromColors(colors);
        results.push({
            name: '🧭 دَلِيل Color Palette',
            passed: allHex && colors.length > 0 && (decoded === null || decoded === void 0 ? void 0 : decoded.peerId) === beacon.peerId,
            detail: allHex
                ? `✓ ${colors.length} hex colors — sample: ${colors.slice(0, 3).join(' ')}`
                : '✗ Invalid color format',
        });
    }
    catch (err) {
        results.push({ name: '🧭 دَلِيل Colors', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 11: غَيْبَة (Ghayba) - Rendezvous Computation
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.toggleMethod('ghayba', true);
        const config = {
            sharedSecret: 'our_shared_secret_2026',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };
        // Both "peers" compute independently
        const rv1 = MaladhDiscovery_1.maladhDiscovery.ghaybaComputeRendezvous(config);
        const rv2 = MaladhDiscovery_1.maladhDiscovery.ghaybaComputeRendezvous(config);
        const timesMatch = rv1.windowStart === rv2.windowStart;
        const portsMatch = rv1.port === rv2.port;
        const validPort = rv1.port >= 10000 && rv1.port <= 65000;
        results.push({
            name: '👻 غَيْبَة Rendezvous Determinism',
            passed: timesMatch && portsMatch && validPort,
            detail: timesMatch
                ? `✓ Both peers compute same window: ${new Date(rv1.windowStart).toISOString()} port ${rv1.port}`
                : `✗ Times don't match: ${rv1.windowStart} vs ${rv2.windowStart}`,
        });
    }
    catch (err) {
        results.push({ name: '👻 غَيْبَة Rendezvous', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 12: غَيْبَة Different Secrets → Different Windows
    // ─────────────────────────────────────────────────────────
    try {
        const config1 = {
            sharedSecret: 'secret_A',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };
        const config2 = {
            sharedSecret: 'secret_B',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };
        const rv1 = MaladhDiscovery_1.maladhDiscovery.ghaybaComputeRendezvous(config1);
        const rv2 = MaladhDiscovery_1.maladhDiscovery.ghaybaComputeRendezvous(config2);
        const differentTimes = rv1.windowStart !== rv2.windowStart || rv1.port !== rv2.port;
        results.push({
            name: '👻 غَيْبَة Secret Isolation',
            passed: differentTimes,
            detail: differentTimes
                ? `✓ Different secrets → different rendezvous (port ${rv1.port} vs ${rv2.port})`
                : '✗ Same rendezvous for different secrets!',
        });
    }
    catch (err) {
        results.push({ name: '👻 غَيْبَة Isolation', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 13: Nonce Generation
    // ─────────────────────────────────────────────────────────
    try {
        const nonces = new Set();
        for (let i = 0; i < 100; i++) {
            nonces.add(MaladhDiscovery_1.default.generateNonce());
        }
        results.push({
            name: '🔑 Nonce Uniqueness',
            passed: nonces.size === 100,
            detail: `✓ ${nonces.size}/100 unique nonces generated`,
        });
    }
    catch (err) {
        results.push({ name: '🔑 Nonce', passed: false, detail: `Error: ${err}` });
    }
    // ─────────────────────────────────────────────────────────
    // Test 14: Method Toggle Guard
    // ─────────────────────────────────────────────────────────
    try {
        MaladhDiscovery_1.maladhDiscovery.deactivate();
        const beacon = createTestBeacon('guard');
        // These should return empty/null when inactive
        const delays = MaladhDiscovery_1.maladhDiscovery.ramadEncode(beacon);
        const stego = MaladhDiscovery_1.maladhDiscovery.dalilPublish(beacon, 'cover text');
        results.push({
            name: '🛡️ Method Toggle Guard',
            passed: delays.length === 0 && stego === 'cover text',
            detail: delays.length === 0
                ? '✓ Inactive methods correctly return no-op results'
                : '✗ Methods still active when engine is off',
        });
        // Re-activate for cleanup
        MaladhDiscovery_1.maladhDiscovery.activate();
    }
    catch (err) {
        results.push({ name: '🛡️ Guard', passed: false, detail: `Error: ${err}` });
    }
    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    // Debug: print failures
    results.filter(r => !r.passed).forEach(r => console.log('FAILED TEST:', r.name, r.detail));
    console.log(`[مَلَاذ اِخْتِبَار] ${passed}/${total} tests passed`);
    return results;
}
exports.default = runMaladhTests;
