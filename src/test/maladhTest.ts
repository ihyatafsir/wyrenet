/**
 * اِخْتِبَار المَلَاذ (Ikhtibar al-Maladh) - Maladh Test Suite
 * Tests for all 5 stealth discovery primitives
 */

import MaladhDiscovery, {
    maladhDiscovery,
    MaladhBeacon,
    HajarConfig,
    GhaybaConfig,
} from '../network/MaladhDiscovery';
import { shabahStego } from '../network/ShabahStego';

// ═══════════════════════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════════════════════

function createTestBeacon(suffix: string = '1'): MaladhBeacon {
    return MaladhDiscovery.createBeacon(
        `peer_${suffix}@wyresup.test`,
        `abcdef1234567890abcdef1234567890${suffix}`,
        [{ type: 'tcp', host: '192.168.1.100', port: 9000, priority: 1 }],
        300,
    );
}

interface TestResult {
    name: string;
    passed: boolean;
    detail: string;
}

// ═══════════════════════════════════════════════════════════════
// Test Runner
// ═══════════════════════════════════════════════════════════════

export async function runMaladhTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Ensure engine is fresh
    maladhDiscovery.clearDiscoveredPeers();

    // ─────────────────────────────────────────────────────────
    // Test 1: حَجَر (Hajar) - Dead-Drop Round Trip
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.activate();
        maladhDiscovery.toggleMethod('hajar', true);

        const beacon = createTestBeacon('hajar');
        const config: HajarConfig = {
            dropType: 'file',
            location: '/tmp/wyresup_test_drop',
            pollInterval: 10,
            encryptionKey: 'test_secret_key_hajar_2026',
        };

        // Publish
        const dropPayload = maladhDiscovery.hajarPublish(config, beacon);
        const hasPayload = dropPayload.length > 0;

        // Search (retrieve)
        const found = maladhDiscovery.hajarSearch(config, dropPayload);
        const match = found?.peerId === beacon.peerId;

        results.push({
            name: '🪨 حَجَر Dead-Drop Round Trip',
            passed: hasPayload && !!match,
            detail: match
                ? `✓ Beacon round-tripped (${dropPayload.length} chars) — peer ${found?.peerId.slice(0, 16)}...`
                : `✗ Mismatch: got ${found?.peerId || 'null'}`,
        });
    } catch (err) {
        results.push({ name: '🪨 حَجَر Dead-Drop', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 2: حَجَر Paste Format
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('paste');
        const config: HajarConfig = {
            dropType: 'paste',
            location: 'https://paste.example.com/abc',
            pollInterval: 30,
            encryptionKey: 'paste_key_xyz',
        };

        const pasteContent = maladhDiscovery.hajarPublish(config, beacon);
        const hasBuildLog = pasteContent.includes('Build Log');
        const found = maladhDiscovery.hajarSearch(config, pasteContent);

        results.push({
            name: '🪨 حَجَر Paste Disguise',
            passed: hasBuildLog && found?.peerId === beacon.peerId,
            detail: hasBuildLog
                ? `✓ Data disguised as CI build log — ${pasteContent.split('\n').length} lines`
                : '✗ Paste format not applied',
        });
    } catch (err) {
        results.push({ name: '🪨 حَجَر Paste', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 3: حَجَر DNS TXT Format
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('dns');
        const config: HajarConfig = {
            dropType: 'dns',
            location: '_wyresup.example.com',
            pollInterval: 60,
            encryptionKey: 'dns_key_secret',
        };

        const dnsPayload = maladhDiscovery.hajarPublish(config, beacon);
        const hasDnsFormat = dnsPayload.includes('v=wyrspf');
        const found = maladhDiscovery.hajarSearch(config, dnsPayload);

        results.push({
            name: '🪨 حَجَر DNS TXT Format',
            passed: hasDnsFormat && found?.peerId === beacon.peerId,
            detail: hasDnsFormat
                ? `✓ Encoded as ${dnsPayload.split('\n').length} DNS TXT records`
                : '✗ DNS format not applied',
        });
    } catch (err) {
        results.push({ name: '🪨 حَجَر DNS TXT', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 4: حَجَر Replay Protection
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('replay');
        const config: HajarConfig = {
            dropType: 'file',
            location: '/tmp/replay_test',
            pollInterval: 10,
            encryptionKey: 'replay_key',
        };

        const payload = maladhDiscovery.hajarPublish(config, beacon);
        maladhDiscovery.hajarSearch(config, payload); // First read
        const replay = maladhDiscovery.hajarSearch(config, payload); // Second read

        results.push({
            name: '🪨 حَجَر Replay Protection',
            passed: replay === null,
            detail: replay === null
                ? '✓ Duplicate beacon correctly rejected'
                : '✗ Replay not detected',
        });
    } catch (err) {
        results.push({ name: '🪨 حَجَر Replay', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 5: رَمَاد (Ramad) - Timing Signal Round Trip
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.toggleMethod('ramad', true);

        const beacon = createTestBeacon('ramad');
        const delays = maladhDiscovery.ramadEncode(beacon);
        const hasSync = delays[0] === 300 && delays[delays.length - 1] === 300;
        const decoded = maladhDiscovery.ramadDecode(delays);

        results.push({
            name: '🔥 رَمَاد Timing Signal Round Trip',
            passed: hasSync && decoded?.peerId === beacon.peerId,
            detail: hasSync
                ? `✓ ${delays.length} intervals — sync pulses OK — decoded peer ${decoded?.peerId.slice(0, 16)}...`
                : '✗ Sync pulse structure invalid',
        });
    } catch (err) {
        results.push({ name: '🔥 رَمَاد Timing', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 6: رَمَاد Noise Tolerance
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('noise');
        const delays = maladhDiscovery.ramadEncode(beacon);

        // Add slight noise (±15ms) within tolerance
        const noisy = delays.map(d => d + (Math.random() * 20 - 10));
        const decoded = maladhDiscovery.ramadDecode(noisy);

        results.push({
            name: '🔥 رَمَاد Noise Tolerance',
            passed: decoded?.peerId === beacon.peerId,
            detail: decoded
                ? `✓ Decoded correctly despite ±10ms jitter`
                : '✗ Failed to decode with noise',
        });
    } catch (err) {
        results.push({ name: '🔥 رَمَاد Noise', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 7: قِنَاع (Qina') - Disguised HTTP Probe
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.toggleMethod('qina', true);

        const beacon = createTestBeacon('qina');
        const probe = maladhDiscovery.qinaCreateProbe(beacon);
        const looksLikeGoogle = probe.url.includes('google.com/search');
        const hasUA = probe.headers['User-Agent'].includes('Mozilla');
        const extracted = maladhDiscovery.qinaExtractProbe(probe.url, probe.headers);
        results.push({
            name: '🎭 قِنَاع Disguised HTTP Probe',
            passed: looksLikeGoogle && extracted?.peerId === beacon.peerId,
            detail: looksLikeGoogle
                ? `✓ Probe disguised as Google search — extracted peer ${extracted?.peerId.slice(0, 16)}...`
                : '✗ Probe doesn\'t look like normal HTTP',
        });
    } catch (err) {
        results.push({ name: '🎭 قِنَاع Probe', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 8: دَلِيل (Dalil) - Stego Text Advertisement
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.toggleMethod('dalil', true);

        const beacon = createTestBeacon('dalil');
        const coverText = 'Just had the best coffee this morning! ☕ Nothing beats a fresh brew to start the day. #MondayMotivation #GoodVibes #MorningRoutine. The weather is so nice today, I might just go for a walk later with friends!';
        const stegoText = maladhDiscovery.dalilPublish(beacon, coverText);

        // The visible text should look the same
        const visibleChars = Array.from(stegoText).filter((c: any) =>
            c.charCodeAt(0) > 0x200F || c.charCodeAt(0) < 0x200B
        ).join('');

        const extracted = maladhDiscovery.dalilExtract(stegoText);

        results.push({
            name: '🧭 دَلِيل Stego Text Ad',
            passed: visibleChars.includes('coffee') && extracted?.peerId === beacon.peerId,
            detail: extracted
                ? `✓ Hidden beacon in "${coverText.slice(0, 30)}..." — peer ${extracted.peerId.slice(0, 16)}...`
                : '✗ Failed to extract from stego text',
        });
    } catch (err) {
        results.push({ name: '🧭 دَلِيل Stego', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 9: دَلِيل Emoji Encoding
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('emoji');
        const emoji = maladhDiscovery.dalilPublishEmoji(beacon);
        const hasEmoji = emoji.length > 0;

        // Decode via shabahStego
        const decoded = shabahStego.decodeFromEmoji(emoji);
        const parsed = decoded ? JSON.parse(decoded) : null;

        results.push({
            name: '🧭 دَلِيل Emoji Encoding',
            passed: hasEmoji && parsed?.i === beacon.peerId,
            detail: hasEmoji
                ? `✓ ${Array.from(emoji).length} emoji chars — decoded peer ${parsed?.i?.slice(0, 16)}...`
                : '✗ No emoji output',
        });
    } catch (err) {
        results.push({ name: '🧭 دَلِيل Emoji', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 10: دَلِيل Color Palette
    // ─────────────────────────────────────────────────────────
    try {
        const beacon = createTestBeacon('color');
        const colors = maladhDiscovery.dalilPublishColors(beacon);
        const allHex = colors.every(c => /^#[0-9a-f]{6}$/.test(c));

        // Decode via shabahStego
        const decoded = shabahStego.decodePeerFromColors(colors);

        results.push({
            name: '🧭 دَلِيل Color Palette',
            passed: allHex && colors.length > 0 && decoded?.peerId === beacon.peerId,
            detail: allHex
                ? `✓ ${colors.length} hex colors — sample: ${colors.slice(0, 3).join(' ')}`
                : '✗ Invalid color format',
        });
    } catch (err) {
        results.push({ name: '🧭 دَلِيل Colors', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 11: غَيْبَة (Ghayba) - Rendezvous Computation
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.toggleMethod('ghayba', true);

        const config: GhaybaConfig = {
            sharedSecret: 'our_shared_secret_2026',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };

        // Both "peers" compute independently
        const rv1 = maladhDiscovery.ghaybaComputeRendezvous(config);
        const rv2 = maladhDiscovery.ghaybaComputeRendezvous(config);

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
    } catch (err) {
        results.push({ name: '👻 غَيْبَة Rendezvous', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 12: غَيْبَة Different Secrets → Different Windows
    // ─────────────────────────────────────────────────────────
    try {
        const config1: GhaybaConfig = {
            sharedSecret: 'secret_A',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };
        const config2: GhaybaConfig = {
            sharedSecret: 'secret_B',
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        };

        const rv1 = maladhDiscovery.ghaybaComputeRendezvous(config1);
        const rv2 = maladhDiscovery.ghaybaComputeRendezvous(config2);

        const differentTimes = rv1.windowStart !== rv2.windowStart || rv1.port !== rv2.port;

        results.push({
            name: '👻 غَيْبَة Secret Isolation',
            passed: differentTimes,
            detail: differentTimes
                ? `✓ Different secrets → different rendezvous (port ${rv1.port} vs ${rv2.port})`
                : '✗ Same rendezvous for different secrets!',
        });
    } catch (err) {
        results.push({ name: '👻 غَيْبَة Isolation', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 13: Nonce Generation
    // ─────────────────────────────────────────────────────────
    try {
        const nonces = new Set<string>();
        for (let i = 0; i < 100; i++) {
            nonces.add(MaladhDiscovery.generateNonce());
        }

        results.push({
            name: '🔑 Nonce Uniqueness',
            passed: nonces.size === 100,
            detail: `✓ ${nonces.size}/100 unique nonces generated`,
        });
    } catch (err) {
        results.push({ name: '🔑 Nonce', passed: false, detail: `Error: ${err}` });
    }

    // ─────────────────────────────────────────────────────────
    // Test 14: Method Toggle Guard
    // ─────────────────────────────────────────────────────────
    try {
        maladhDiscovery.deactivate();
        const beacon = createTestBeacon('guard');

        // These should return empty/null when inactive
        const delays = maladhDiscovery.ramadEncode(beacon);
        const stego = maladhDiscovery.dalilPublish(beacon, 'cover text');

        results.push({
            name: '🛡️ Method Toggle Guard',
            passed: delays.length === 0 && stego === 'cover text',
            detail: delays.length === 0
                ? '✓ Inactive methods correctly return no-op results'
                : '✗ Methods still active when engine is off',
        });

        // Re-activate for cleanup
        maladhDiscovery.activate();
    } catch (err) {
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

export default runMaladhTests;
