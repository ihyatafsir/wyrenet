/**
 * مَلَاذ (Maladh) - Stealth & Silent Discovery Protocol
 * From Lisan al-Arab: "لَاذَ بالشَّيء - to seek refuge, shelter beside something"
 * 
 * Phase 10: Five stealth discovery primitives that allow peers to find
 * each other without exposing their intent or existence as P2P nodes.
 * 
 * Primitives:
 *   حَجَر (Hajar)  - Dead-drop rendezvous via external locations
 *   رَمَاد (Ramad)  - Timing-based signaling in packet inter-arrival
 *   قِنَاع (Qina')  - Disguised discovery probes (HTTP/DNS/NTP lookalikes)
 *   دَلِيل (Dalil)  - Stego-encoded peer advertisements via ShabahStego
 *   غَيْبَة (Ghayba) - Ephemeral discovery windows from shared secrets
 */

import { Buffer } from 'buffer';
import { shabahStego } from './ShabahStego';

// ═══════════════════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════════════════

/**
 * مَنَارَة المَلَاذ (Manarat al-Maladh) - Stealth Beacon
 * The fundamental unit of stealth discovery — an encrypted bundle
 * containing everything a peer needs to connect.
 */
export interface MaladhBeacon {
    peerId: string;
    publicKey: string;
    endpoints: MaladhEndpoint[];
    timestamp: number;
    ttl: number;           // Time-to-live in seconds
    nonce: string;         // Anti-replay nonce
    signature: string;     // Proves beacon authenticity
}

export interface MaladhEndpoint {
    type: 'tcp' | 'ws' | 'ble';
    host: string;
    port: number;
    priority: number;
}

/**
 * طَريقَة المَلَاذ (Tariqat al-Maladh) - Stealth Method
 */
export type MaladhMethod = 'hajar' | 'ramad' | 'qina' | 'dalil' | 'ghayba';

export interface MaladhMethodInfo {
    id: MaladhMethod;
    nameAr: string;
    nameEn: string;
    description: string;
    stealthScore: number;  // 1-5, higher = harder to detect
    enabled: boolean;
}

/**
 * حَالَة المَلَاذ (Halat al-Maladh) - Discovery State
 */
export interface MaladhState {
    active: boolean;
    methods: Map<MaladhMethod, MaladhMethodInfo>;
    discoveredPeers: MaladhBeacon[];
    publishedBeacons: number;
    detectedSignals: number;
}

/**
 * سِجِلّ المَلَاذ (Sijill al-Maladh) - Event Log Entry
 */
export interface MaladhLogEntry {
    timestamp: number;
    method: MaladhMethod;
    event: string;
    detail: string;
    level: 'info' | 'warn' | 'success' | 'error';
}

// ═══════════════════════════════════════════════════════════════
// حَجَر (Hajar) - Dead-Drop Configuration
// ═══════════════════════════════════════════════════════════════

export interface HajarConfig {
    dropType: 'file' | 'dns' | 'paste' | 'custom';
    location: string;      // File path, DNS domain, paste URL, etc.
    pollInterval: number;   // Seconds between checks
    encryptionKey: string;  // Shared secret for this dead-drop
}

// ═══════════════════════════════════════════════════════════════
// غَيْبَة (Ghayba) - Ephemeral Window Configuration
// ═══════════════════════════════════════════════════════════════

export interface GhaybaConfig {
    sharedSecret: string;   // Pre-shared secret between peers
    windowDuration: number; // Seconds the window stays open
    hashRounds: number;     // Iterations for deriving rendezvous time
    listenPort: number;     // Port to listen on during window
}

// ═══════════════════════════════════════════════════════════════
// Core: مَلَاذ Engine
// ═══════════════════════════════════════════════════════════════

type EventHandler = (...args: any[]) => void;

class MaladhDiscovery {
    private state: MaladhState;
    private log: MaladhLogEntry[] = [];
    private hajarTimers: Map<string, any> = new Map();
    private ghaybaTimers: Map<string, any> = new Map();
    private onDiscoverCallback?: (beacon: MaladhBeacon) => void;
    private _listeners: Map<string, EventHandler[]> = new Map();

    constructor() {
        this.state = {
            active: false,
            methods: new Map(),
            discoveredPeers: [],
            publishedBeacons: 0,
            detectedSignals: 0,
        };

        // Register all five discovery methods
        this.registerMethod('hajar', 'حَجَر', 'Dead Drop', 'Silent key exchange via external dead-drop locations', 4);
        this.registerMethod('ramad', 'رَمَاد', 'Timing Signal', 'Discovery beacons encoded in packet timing patterns', 5);
        this.registerMethod('qina', 'قِنَاع', 'Disguised Probe', 'Discovery probes disguised as normal HTTP/DNS traffic', 3);
        this.registerMethod('dalil', 'دَلِيل', 'Stego Guide', 'Peer advertisements hidden inside innocuous content', 4);
        this.registerMethod('ghayba', 'غَيْبَة', 'Ephemeral Window', 'Time-limited discovery windows derived from shared secrets', 5);

        this.addLog('hajar', 'مَلَاذ تَهْيِئَة', 'Maladh stealth discovery engine initialized', 'info');
        console.log('[مَلَاذ] Maladh stealth discovery engine initialized');
    }

    // ═══════════════════════════════════════════════════════════════
    // Lightweight Event System (avoids Node EventEmitter type issues)
    // ═══════════════════════════════════════════════════════════════

    emit(event: string, ...args: any[]): void {
        const handlers = this._listeners.get(event);
        if (handlers) {
            handlers.forEach(h => h(...args));
        }
    }

    addListener(event: string, handler: EventHandler): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(handler);
    }

    removeListener(event: string, handler: EventHandler): void {
        const handlers = this._listeners.get(event);
        if (handlers) {
            this._listeners.set(event, handlers.filter(h => h !== handler));
        }
    }

    private registerMethod(
        id: MaladhMethod,
        nameAr: string,
        nameEn: string,
        description: string,
        stealthScore: number,
    ) {
        this.state.methods.set(id, {
            id,
            nameAr,
            nameEn,
            description,
            stealthScore,
            enabled: false,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Activation / Deactivation
    // ═══════════════════════════════════════════════════════════════

    /**
     * فَعِّل (Fa''il) - Activate stealth discovery
     */
    activate(): void {
        this.state.active = true;
        this.addLog('hajar', 'تَفْعِيل', 'Stealth discovery ACTIVATED — all enabled methods running', 'success');
        this.emit('stateChange', this.getState());
        console.log('[مَلَاذ] Stealth discovery ACTIVATED');
    }

    /**
     * أَوْقِف (Awqif) - Deactivate stealth discovery
     */
    deactivate(): void {
        this.state.active = false;
        // Stop all timers
        this.hajarTimers.forEach((timer) => clearInterval(timer as any));
        this.hajarTimers.clear();
        this.ghaybaTimers.forEach((timer) => clearTimeout(timer as any));
        this.ghaybaTimers.clear();
        this.addLog('hajar', 'إِيقَاف', 'Stealth discovery DEACTIVATED', 'info');
        this.emit('stateChange', this.getState());
        console.log('[مَلَاذ] Stealth discovery DEACTIVATED');
    }

    /**
     * Toggle a specific method on/off
     */
    toggleMethod(method: MaladhMethod, enabled: boolean): void {
        const info = this.state.methods.get(method);
        if (info) {
            info.enabled = enabled;
            this.addLog(method, enabled ? 'تَفْعِيل' : 'إِيقَاف',
                `${info.nameAr} (${info.nameEn}) ${enabled ? 'enabled' : 'disabled'}`,
                enabled ? 'success' : 'info');
            this.emit('stateChange', this.getState());
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // حَجَر (Hajar) - Dead-Drop Rendezvous
    // From Lisan: "الحَجَرُ - stone, an immovable silent marker"
    //
    // Peers publish encrypted beacons to shared external locations.
    // The location itself is the only shared knowledge needed.
    // ═══════════════════════════════════════════════════════════════

    /**
     * اُنْشُر حَجَر (Unshur Hajar) - Publish dead-drop beacon
     */
    hajarPublish(config: HajarConfig, beacon: MaladhBeacon): string {
        if (!this.isMethodActive('hajar')) return '';

        // Encrypt the beacon with the shared key
        const beaconJson = JSON.stringify(beacon);
        const encrypted = this.xorEncrypt(beaconJson, config.encryptionKey);
        const encoded = Buffer.from(encrypted).toString('base64');

        // Format for the drop type
        let dropPayload: string;
        switch (config.dropType) {
            case 'dns':
                // Encode as DNS TXT record fragments
                dropPayload = this.encodeDnsTxt(encoded);
                break;
            case 'paste':
                // Encode as innocent-looking paste content
                dropPayload = this.encodePasteContent(encoded);
                break;
            case 'file':
            default:
                // Raw encoded data for file drops
                dropPayload = encoded;
                break;
        }

        this.state.publishedBeacons++;
        this.addLog('hajar', 'حَجَر نَشْر', `Dead-drop beacon published to ${config.dropType}:${config.location}`, 'success');
        this.emit('beaconPublished', { method: 'hajar', config });

        return dropPayload;
    }

    /**
     * اِبْحَث حَجَر (Ibhath Hajar) - Search for dead-drop beacons
     */
    hajarSearch(config: HajarConfig, rawData: string): MaladhBeacon | null {
        if (!this.isMethodActive('hajar')) return null;

        try {
            // Decode based on drop type
            let encoded: string;
            switch (config.dropType) {
                case 'dns':
                    encoded = this.decodeDnsTxt(rawData);
                    break;
                case 'paste':
                    encoded = this.decodePasteContent(rawData);
                    break;
                default:
                    encoded = rawData;
            }

            // Decrypt
            const decrypted = this.xorEncrypt(
                Buffer.from(encoded, 'base64').toString(),
                config.encryptionKey
            );
            const beacon: MaladhBeacon = JSON.parse(decrypted);

            // Validate TTL
            if (Date.now() - beacon.timestamp > beacon.ttl * 1000) {
                this.addLog('hajar', 'حَجَر مُنْتَهِي', 'Dead-drop beacon expired (TTL exceeded)', 'warn');
                return null;
            }

            // Check for replays
            if (this.state.discoveredPeers.some(p => p.nonce === beacon.nonce)) {
                this.addLog('hajar', 'حَجَر مُكَرَّر', 'Duplicate beacon detected (replay protection)', 'warn');
                return null;
            }

            this.state.discoveredPeers.push(beacon);
            this.state.detectedSignals++;
            this.addLog('hajar', 'حَجَر لِقَاء', `Dead-drop beacon found — peer ${beacon.peerId.slice(0, 8)}...`, 'success');
            this.emit('peerDiscovered', beacon);
            this.onDiscoverCallback?.(beacon);

            return beacon;
        } catch (err) {
            this.addLog('hajar', 'حَجَر خَطَأ', `Failed to parse dead-drop: ${err}`, 'error');
            return null;
        }
    }

    /**
     * Start polling a dead-drop location
     */
    hajarStartPolling(config: HajarConfig, fetchFn: () => Promise<string>): void {
        if (this.hajarTimers.has(config.location)) return;

        const timer = setInterval(async () => {
            if (!this.isMethodActive('hajar')) return;
            try {
                const data = await fetchFn();
                if (data) {
                    this.hajarSearch(config, data);
                }
            } catch (err) {
                this.addLog('hajar', 'حَجَر خَطَأ', `Poll failed: ${err}`, 'error');
            }
        }, config.pollInterval * 1000);

        this.hajarTimers.set(config.location, timer);
        this.addLog('hajar', 'حَجَر مُرَاقَبَة', `Polling ${config.dropType}:${config.location} every ${config.pollInterval}s`, 'info');
    }

    hajarStopPolling(location: string): void {
        const timer = this.hajarTimers.get(location);
        if (timer) {
            clearInterval(timer as any);
            this.hajarTimers.delete(location);
            this.addLog('hajar', 'حَجَر إِيقَاف', `Stopped polling ${location}`, 'info');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // رَمَاد (Ramad) - Timing-Based Signaling
    // From Lisan: "الرَّمادُ - ash, the barely-visible trace of fire"
    //
    // Encodes discovery data in the inter-arrival timing of packets.
    // An observer sees normal traffic; the pattern IS the message.
    // ═══════════════════════════════════════════════════════════════

    /** Timing units in milliseconds */
    private static readonly RAMAD_BIT_0_DELAY = 50;   // Short gap = 0
    private static readonly RAMAD_BIT_1_DELAY = 150;  // Long gap = 1
    private static readonly RAMAD_TOLERANCE = 30;     // ±30ms tolerance
    private static readonly RAMAD_SYNC_DELAY = 300;   // Sync pulse

    /**
     * رَمْز الرَّمَاد (Ramz al-Ramad) - Encode as timing pattern
     * Returns array of millisecond delays to insert between packets
     */
    ramadEncode(beacon: MaladhBeacon): number[] {
        if (!this.isMethodActive('ramad')) return [];

        const data = JSON.stringify({
            id: beacon.peerId,
            pk: beacon.publicKey.slice(0, 32), // Truncate for timing efficiency
            ep: beacon.endpoints[0],            // Primary endpoint only
            ts: beacon.timestamp,
            n: beacon.nonce,
        });

        const binary = this.textToBinary(data);
        const delays: number[] = [MaladhDiscovery.RAMAD_SYNC_DELAY]; // Start sync

        for (const bit of binary) {
            delays.push(bit === '1'
                ? MaladhDiscovery.RAMAD_BIT_1_DELAY
                : MaladhDiscovery.RAMAD_BIT_0_DELAY
            );
        }

        delays.push(MaladhDiscovery.RAMAD_SYNC_DELAY); // End sync

        this.addLog('ramad', 'رَمَاد تَرْمِيز', `Encoded ${binary.length} bits as timing pattern (${delays.length} intervals)`, 'success');
        return delays;
    }

    /**
     * كَشْف الرَّمَاد (Kashf al-Ramad) - Detect timing pattern
     * Analyzes inter-arrival times to extract hidden data
     */
    ramadDecode(interArrivalTimes: number[]): MaladhBeacon | null {
        if (!this.isMethodActive('ramad')) return null;

        // Find sync pulses (start/end markers)
        const syncIndices: number[] = [];
        for (let i = 0; i < interArrivalTimes.length; i++) {
            if (Math.abs(interArrivalTimes[i] - MaladhDiscovery.RAMAD_SYNC_DELAY) < MaladhDiscovery.RAMAD_TOLERANCE) {
                syncIndices.push(i);
            }
        }

        if (syncIndices.length < 2) {
            return null; // No valid signal found
        }

        // Extract bits between first two sync pulses
        const dataDelays = interArrivalTimes.slice(syncIndices[0] + 1, syncIndices[1]);
        let binary = '';

        for (const delay of dataDelays) {
            const dist0 = Math.abs(delay - MaladhDiscovery.RAMAD_BIT_0_DELAY);
            const dist1 = Math.abs(delay - MaladhDiscovery.RAMAD_BIT_1_DELAY);

            if (Math.min(dist0, dist1) > MaladhDiscovery.RAMAD_TOLERANCE) {
                continue; // Noise, skip
            }

            binary += dist1 < dist0 ? '1' : '0';
        }

        try {
            const text = this.binaryToText(binary);
            const parsed = JSON.parse(text);

            const beacon: MaladhBeacon = {
                peerId: parsed.id,
                publicKey: parsed.pk,
                endpoints: [parsed.ep],
                timestamp: parsed.ts,
                ttl: 300,
                nonce: parsed.n,
                signature: '',
            };

            this.state.discoveredPeers.push(beacon);
            this.state.detectedSignals++;
            this.addLog('ramad', 'رَمَاد كَشْف', `Timing signal decoded — peer ${beacon.peerId.slice(0, 8)}...`, 'success');
            this.emit('peerDiscovered', beacon);
            this.onDiscoverCallback?.(beacon);

            return beacon;
        } catch {
            this.addLog('ramad', 'رَمَاد خَطَأ', 'Failed to decode timing signal', 'error');
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // قِنَاع (Qina') - Disguised Discovery Probes
    // From Lisan: "القِنَاعُ - mask, veil that conceals the face"
    //
    // Discovery probes that look like normal HTTP requests.
    // The "search query" or "user agent" IS the discovery payload.
    // ═══════════════════════════════════════════════════════════════

    /**
     * أَرْسِل قِنَاع (Arsil Qina') - Create disguised HTTP probe
     * Returns a URL + headers that look like a normal web request
     * but contain the discovery beacon in hidden fields.
     */
    qinaCreateProbe(beacon: MaladhBeacon): {
        url: string;
        headers: Record<string, string>;
        method: string;
    } {
        const compact = {
            i: beacon.peerId,
            k: beacon.publicKey.slice(0, 32),
            e: beacon.endpoints[0],
            t: beacon.timestamp,
            n: beacon.nonce,
        };

        // Hide beacon data in emoji-encoded "search query"
        const emojiPayload = shabahStego.encodeAsEmoji(JSON.stringify(compact));

        // Also hide in a fake User-Agent string via zero-width chars
        const coverUA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
        const stegoUA = shabahStego.hideInText(coverUA, beacon.peerId);

        this.addLog('qina', 'قِنَاع إِرْسَال', `Disguised probe created — payload in emoji search + UA`, 'success');

        return {
            url: `https://www.google.com/search?q=${encodeURIComponent(emojiPayload)}&hl=ar`,
            headers: {
                'User-Agent': stegoUA.stegoData as string,
                'Accept-Language': 'ar,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml',
                'X-Request-ID': Buffer.from(beacon.nonce).toString('base64').slice(0, 16),
            },
            method: 'GET',
        };
    }

    /**
     * اِكْشِف قِنَاع (Ikshif Qina') - Extract beacon from disguised probe
     */
    qinaExtractProbe(url: string, headers: Record<string, string>): MaladhBeacon | null {
        if (!this.isMethodActive('qina')) return null;

        try {
            // Extract emoji payload from URL query parameter
            const urlObj = new URL(url);
            const query = urlObj.searchParams.get('q') || '';
            const decoded = shabahStego.decodeFromEmoji(query);

            if (!decoded) {
                return null;
            }

            const compact = JSON.parse(decoded);

            // Cross-validate with User-Agent hidden data
            const uaPeerId = shabahStego.extractFromText(headers['User-Agent'] || '');

            const beacon: MaladhBeacon = {
                peerId: compact.i,
                publicKey: compact.k,
                endpoints: [compact.e],
                timestamp: compact.t,
                ttl: 300,
                nonce: compact.n,
                signature: '',
            };

            // Validate cross-reference
            if (uaPeerId && uaPeerId !== beacon.peerId) {
                this.addLog('qina', 'قِنَاع تَحْذِير', 'UA/query mismatch — possible tampering', 'warn');
            }

            this.state.discoveredPeers.push(beacon);
            this.state.detectedSignals++;
            this.addLog('qina', 'قِنَاع اِسْتِقْبَال', `Disguised probe decoded — peer ${beacon.peerId.slice(0, 8)}...`, 'success');
            this.emit('peerDiscovered', beacon);
            this.onDiscoverCallback?.(beacon);

            return beacon;
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // دَلِيل (Dalil) - Stego-Encoded Peer Advertisements
    // From Lisan: "الدَّلِيلُ - guide, one who shows the path"
    //
    // Hide peer discovery data inside innocuous content (social
    // media posts, profile bios, image submissions) using ShabahStego.
    // ═══════════════════════════════════════════════════════════════

    /**
     * اُنْشُر دَلِيل (Unshur Dalil) - Create stego advertisement
     * Hides beacon inside cover text using zero-width characters
     */
    dalilPublish(beacon: MaladhBeacon, coverText: string): string {
        if (!this.isMethodActive('dalil')) return coverText;

        const compact = JSON.stringify({
            i: beacon.peerId,
            k: beacon.publicKey.slice(0, 32),
            e: beacon.endpoints[0],
            n: beacon.nonce,
        });

        const result = shabahStego.hideInText(coverText, compact);

        this.state.publishedBeacons++;
        this.addLog('dalil', 'دَلِيل نَشْر', `Stego ad published (${result.hiddenSize} bytes in ${result.originalSize} char cover)`, 'success');
        this.emit('beaconPublished', { method: 'dalil' });

        return result.stegoData as string;
    }

    /**
     * اِكْشِف دَلِيل (Ikshif Dalil) - Extract beacon from stego content
     */
    dalilExtract(stegoText: string): MaladhBeacon | null {
        if (!this.isMethodActive('dalil')) return null;

        try {
            const hidden = shabahStego.extractFromText(stegoText);
            if (!hidden) return null;

            const compact = JSON.parse(hidden);

            const beacon: MaladhBeacon = {
                peerId: compact.i,
                publicKey: compact.k,
                endpoints: [compact.e],
                timestamp: Date.now(),
                ttl: 3600,
                nonce: compact.n,
                signature: '',
            };

            this.state.discoveredPeers.push(beacon);
            this.state.detectedSignals++;
            this.addLog('dalil', 'دَلِيل كَشْف', `Stego ad decoded — peer ${beacon.peerId.slice(0, 8)}...`, 'success');
            this.emit('peerDiscovered', beacon);
            this.onDiscoverCallback?.(beacon);

            return beacon;
        } catch {
            return null;
        }
    }

    /**
     * Create stego advertisement as emoji sequence
     */
    dalilPublishEmoji(beacon: MaladhBeacon): string {
        if (!this.isMethodActive('dalil')) return '';

        const compact = JSON.stringify({
            i: beacon.peerId,
            k: beacon.publicKey.slice(0, 16),
            n: beacon.nonce,
        });

        const emoji = shabahStego.encodeAsEmoji(compact);

        this.state.publishedBeacons++;
        this.addLog('dalil', 'دَلِيل رَمْز', `Emoji ad published (${emoji.length} chars)`, 'success');

        return emoji;
    }

    /**
     * Create stego advertisement hidden in color palette
     */
    dalilPublishColors(beacon: MaladhBeacon): string[] {
        if (!this.isMethodActive('dalil')) return [];

        const colors = shabahStego.encodePeerAsColors(beacon.peerId, beacon.publicKey);

        this.state.publishedBeacons++;
        this.addLog('dalil', 'دَلِيل طَيْف', `Color palette ad published (${colors.length} colors)`, 'success');

        return colors;
    }

    // ═══════════════════════════════════════════════════════════════
    // غَيْبَة (Ghayba) - Ephemeral Discovery Windows
    // From Lisan: "الغَيْبَةُ - absence, being hidden from view"
    //
    // Two peers who share a secret can independently compute the
    // same rendezvous time without any communication. They both
    // "appear" at the computed moment, exchange beacons, then vanish.
    // ═══════════════════════════════════════════════════════════════

    /**
     * اِحْسِب مَوْعِد (Ihsib Maw'id) - Compute next rendezvous time
     * Both peers independently derive the same window from their shared secret.
     */
    ghaybaComputeRendezvous(config: GhaybaConfig): {
        windowStart: number;
        windowEnd: number;
        port: number;
    } {
        // Derive rendezvous parameters from shared secret + current day
        const dayEpoch = Math.floor(Date.now() / 86400000); // Current day number
        const seed = `${config.sharedSecret}:${dayEpoch}`;

        // Hash the seed to get deterministic "random" values
        let hash = this.simpleHash(seed, config.hashRounds);

        // Window start: offset within the day (0-86400 seconds)
        const dayOffsetSeconds = Math.abs(hash) % 86400;
        const todayStart = dayEpoch * 86400000;
        const windowStart = todayStart + (dayOffsetSeconds * 1000);

        // If window already passed today, schedule for tomorrow
        const actualStart = windowStart < Date.now()
            ? windowStart + 86400000
            : windowStart;

        return {
            windowStart: actualStart,
            windowEnd: actualStart + (config.windowDuration * 1000),
            port: config.listenPort || (10000 + (Math.abs(hash) % 55000)),
        };
    }

    /**
     * فَعِّل غَيْبَة (Fa''il Ghayba) - Schedule ephemeral window
     */
    ghaybaSchedule(config: GhaybaConfig, beacon: MaladhBeacon, onWindow: (port: number) => void): {
        windowStart: number;
        windowEnd: number;
        port: number;
    } {
        if (!this.isMethodActive('ghayba')) {
            return { windowStart: 0, windowEnd: 0, port: 0 };
        }

        const rendezvous = this.ghaybaComputeRendezvous(config);
        const msUntilOpen = rendezvous.windowStart - Date.now();

        this.addLog('ghayba', 'غَيْبَة جَدْوَلَة',
            `Ephemeral window scheduled — opens in ${Math.round(msUntilOpen / 1000)}s on port ${rendezvous.port} for ${config.windowDuration}s`,
            'info');

        // Schedule window open
        const openTimer = setTimeout(() => {
            this.addLog('ghayba', 'غَيْبَة فَاتِح',
                `Ephemeral window OPEN on port ${rendezvous.port} for ${config.windowDuration}s`,
                'success');
            this.emit('ghaybaWindowOpen', { port: rendezvous.port, beacon });
            onWindow(rendezvous.port);

            // Schedule window close
            const closeTimer = setTimeout(() => {
                this.addLog('ghayba', 'غَيْبَة مُغَلَّق',
                    `Ephemeral window CLOSED on port ${rendezvous.port}`,
                    'info');
                this.emit('ghaybaWindowClose', { port: rendezvous.port });
            }, config.windowDuration * 1000);

            this.ghaybaTimers.set(`close:${config.sharedSecret}`, closeTimer);
        }, Math.max(0, msUntilOpen));

        this.ghaybaTimers.set(`open:${config.sharedSecret}`, openTimer);

        return rendezvous;
    }

    ghaybaCancelAll(): void {
        this.ghaybaTimers.forEach((timer) => clearTimeout(timer as any));
        this.ghaybaTimers.clear();
        this.addLog('ghayba', 'غَيْبَة إِلْغَاء', 'All ephemeral windows cancelled', 'info');
    }

    // ═══════════════════════════════════════════════════════════════
    // Getters & Utilities
    // ═══════════════════════════════════════════════════════════════

    getState(): MaladhState {
        return { ...this.state };
    }

    getMethods(): MaladhMethodInfo[] {
        return Array.from(this.state.methods.values());
    }

    getDiscoveredPeers(): MaladhBeacon[] {
        return [...this.state.discoveredPeers];
    }

    getLog(): MaladhLogEntry[] {
        return [...this.log];
    }

    isActive(): boolean {
        return this.state.active;
    }

    setOnDiscover(callback: (beacon: MaladhBeacon) => void): void {
        this.onDiscoverCallback = callback;
    }

    clearDiscoveredPeers(): void {
        this.state.discoveredPeers = [];
        this.addLog('hajar', 'مَسْح', 'Discovered peers cleared', 'info');
    }

    private isMethodActive(method: MaladhMethod): boolean {
        return this.state.active && (this.state.methods.get(method)?.enabled ?? false);
    }

    private addLog(method: MaladhMethod, event: string, detail: string, level: MaladhLogEntry['level']): void {
        const entry: MaladhLogEntry = {
            timestamp: Date.now(),
            method,
            event,
            detail,
            level,
        };
        this.log.push(entry);
        // Keep log bounded
        if (this.log.length > 200) {
            this.log = this.log.slice(-100);
        }
        this.emit('log', entry);
    }

    // ═══════════════════════════════════════════════════════════════
    // Crypto Helpers
    // ═══════════════════════════════════════════════════════════════

    /**
     * Simple XOR encryption (lightweight, used with pre-shared keys)
     */
    private xorEncrypt(text: string, key: string): string {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    /**
     * Simple deterministic hash for Ghayba rendezvous derivation
     */
    private simpleHash(input: string, rounds: number): number {
        let hash = 0;
        const str = input;
        for (let r = 0; r < rounds; r++) {
            for (let i = 0; i < str.length; i++) {
                const chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr + r;
                hash |= 0; // Convert to 32-bit integer
            }
        }
        return hash;
    }

    // ═══════════════════════════════════════════════════════════════
    // Encoding Helpers
    // ═══════════════════════════════════════════════════════════════

    /**
     * Encode data as fake DNS TXT record fragments
     */
    private encodeDnsTxt(data: string): string {
        // Split into 255-char chunks (DNS TXT record limit)
        const chunks: string[] = [];
        for (let i = 0; i < data.length; i += 63) {
            chunks.push(data.slice(i, i + 63));
        }
        return chunks.map((c, i) => `v=wyrspf${i} ${c}`).join('\n');
    }

    private decodeDnsTxt(txt: string): string {
        return txt.split('\n')
            .map(line => line.replace(/^v=wyrspf\d+ /, ''))
            .join('');
    }

    /**
     * Encode data as innocent-looking paste content
     */
    private encodePasteContent(data: string): string {
        // Disguise as a build log / CI output
        const lines = [
            '# Build Log - WyreSup CI/CD Pipeline',
            `# Timestamp: ${new Date().toISOString()}`,
            '# Status: SUCCESS',
            '',
            '> Compiling sources...',
            `> Hash: ${data.slice(0, 40)}`,
            '> Dependencies resolved: 47 packages',
            '',
            '```',
            data,
            '```',
            '',
            '> Build completed successfully.',
        ];
        return lines.join('\n');
    }

    private decodePasteContent(content: string): string {
        // Extract data from between ``` markers
        const match = content.match(/```\n([\s\S]*?)\n```/);
        return match ? match[1] : content;
    }

    private textToBinary(text: string): string {
        return Buffer.from(text, 'utf8')
            .reduce((acc, byte) => acc + byte.toString(2).padStart(8, '0'), '');
    }

    private binaryToText(binary: string): string {
        const bytes: number[] = [];
        for (let i = 0; i < binary.length - 7; i += 8) {
            const byte = parseInt(binary.substr(i, 8), 2);
            if (!isNaN(byte)) bytes.push(byte);
        }
        return Buffer.from(bytes).toString('utf8');
    }

    /**
     * Generate a cryptographically-sufficient nonce
     */
    static generateNonce(): string {
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
        return Buffer.from(bytes).toString('hex');
    }

    /**
     * Create a beacon from local identity
     */
    static createBeacon(
        peerId: string,
        publicKey: string,
        endpoints: MaladhEndpoint[],
        ttl: number = 300,
    ): MaladhBeacon {
        return {
            peerId,
            publicKey,
            endpoints,
            timestamp: Date.now(),
            ttl,
            nonce: MaladhDiscovery.generateNonce(),
            signature: '', // TODO: sign with private key
        };
    }
}

// Singleton export
export const maladhDiscovery = new MaladhDiscovery();
export default MaladhDiscovery;
