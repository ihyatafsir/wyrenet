/**
 * نَغَم (Nagham) - DTMF Voice Channel Communication
 * From Lisan al-Arab: "نَغَم - tune, melody, tone"
 * 
 * Establishes P2P connections over traditional voice calls using DTMF tones.
 * Works WITHOUT data/internet - uses the voice channel to transmit encoded data.
 * 
 * How it works:
 * 1. User A calls User B (traditional phone call)
 * 2. User A plays DTMF tones encoding: public key + WyreSup ID
 * 3. User B's app decodes the tones
 * 4. Connection info exchanged over voice channel
 * 5. When data available, use that info to connect via WyreSup
 * 
 * DTMF Encoding:
 * - Each DTMF tone (0-9, *, #, A-D) = 4 bits (0-15 in hex)
 * - Public key (32 bytes) = 64 DTMF tones
 * - Peer ID (16 chars) = 32 DTMF tones
 * - Checksum = 4 DTMF tones
 * 
 * This is like old-school dial-up modems but for P2P key exchange!
 */

import { EventEmitter } from 'events';
import { Platform } from 'react-native';

// DTMF Frequencies (Hz)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
};

// Hex to DTMF mapping (0-F = 0-9,A-D,*,#)
const HEX_TO_DTMF: Record<string, string> = {
    '0': '0', '1': '1', '2': '2', '3': '3',
    '4': '4', '5': '5', '6': '6', '7': '7',
    '8': '8', '9': '9', 'a': 'A', 'b': 'B',
    'c': 'C', 'd': 'D', 'e': '*', 'f': '#',
};

const DTMF_TO_HEX: Record<string, string> = {
    '0': '0', '1': '1', '2': '2', '3': '3',
    '4': '4', '5': '5', '6': '6', '7': '7',
    '8': '8', '9': '9', 'A': 'a', 'B': 'b',
    'C': 'c', 'D': 'd', '*': 'e', '#': 'f',
};

/**
 * حَالَة النَّغَم (Halat al-Nagham) - DTMF State
 */
export type NaghamState = 'sakin' | 'yunghim' | 'yastami' | 'muttasil';
// سَاكِن (idle) | يُنْغِم (transmitting) | يَسْتَمِع (listening) | مُتَّصِل (connected)

export interface NaghamPayload {
    type: 'PEER_EXCHANGE' | 'KEY_EXCHANGE' | 'ACK';
    peerId: string;
    publicKey?: string; // hex encoded
    timestamp: number;
    checksum: string;
}

export interface NaghamConfig {
    toneDuration: number;    // ms per tone (default 100)
    pauseDuration: number;   // ms between tones (default 50)
    sampleRate: number;      // Audio sample rate (default 44100)
}

type StateCallback = (state: NaghamState) => void;
type DecodeCallback = (payload: NaghamPayload) => void;
type ProgressCallback = (current: number, total: number) => void;

class NaghamDTMF extends EventEmitter {
    private state: NaghamState = 'sakin';
    private config: NaghamConfig = {
        toneDuration: 100,
        pauseDuration: 50,
        sampleRate: 44100,
    };

    // Audio context for generating tones
    private audioContext: any = null;
    private isListening = false;
    private decodedBuffer: string[] = [];

    private onStateChange?: StateCallback;
    private onDecode?: DecodeCallback;
    private onProgress?: ProgressCallback;

    constructor() {
        super();
        console.log('[نَغَم] Nagham DTMF channel initialized');
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with audio context
     */
    initialize(config?: Partial<NaghamConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config };
        }
        console.log('[نَغَم] Initialized with config:', this.config);
    }

    /**
     * تَحْوِيل إِلى نَغَم (Tahwil ila Nagham) - Encode data to DTMF tones
     * From Lisan: "حَوَّلَ - to convert, transform"
     */
    encodePayload(payload: NaghamPayload): string[] {
        // Build the data string
        const data = JSON.stringify(payload);
        const hex = this.stringToHex(data);

        // Add checksum
        const checksum = this.calculateChecksum(hex);
        const fullHex = hex + checksum;

        // Convert to DTMF sequence
        const tones: string[] = [];

        // Start marker: **
        tones.push('*', '*');

        // Data length (4 hex digits = 4 tones)
        const lenHex = fullHex.length.toString(16).padStart(4, '0');
        for (const c of lenHex) {
            tones.push(HEX_TO_DTMF[c.toLowerCase()]);
        }

        // Data
        for (const c of fullHex) {
            tones.push(HEX_TO_DTMF[c.toLowerCase()]);
        }

        // End marker: ##
        tones.push('#', '#');

        console.log(`[نَغَم] Encoded ${data.length} bytes → ${tones.length} DTMF tones`);
        return tones;
    }

    /**
     * نَغِّم (Nagghim) - Transmit DTMF tones
     * From Lisan: "نَغَّمَ - to sing, play a tune"
     */
    async transmit(payload: NaghamPayload): Promise<void> {
        if (this.state === 'yunghim') {
            console.warn('[نَغَم] Already transmitting');
            return;
        }

        const tones = this.encodePayload(payload);
        this.setState('yunghim');

        console.log(`[نَغَم] Transmitting ${tones.length} tones...`);

        for (let i = 0; i < tones.length; i++) {
            await this.playTone(tones[i]);
            this.onProgress?.(i + 1, tones.length);
            this.emit('progress', i + 1, tones.length);

            // Pause between tones
            await this.sleep(this.config.pauseDuration);
        }

        console.log('[نَغَم] Transmission complete');
        this.setState('sakin');
    }

    /**
     * عَزْف نَغْمَة (Azf Naghma) - Play a single DTMF tone
     * From Lisan: "عَزَفَ - to play music"
     */
    private async playTone(tone: string): Promise<void> {
        const freqs = DTMF_FREQUENCIES[tone];
        if (!freqs) {
            console.warn(`[نَغَم] Unknown tone: ${tone}`);
            return;
        }

        const [lowFreq, highFreq] = freqs;

        // Note: Actual implementation would use react-native-sound or expo-av
        // This generates the audio buffer that would be played

        console.log(`[نَغَم] ♪ Tone ${tone} (${lowFreq}Hz + ${highFreq}Hz)`);

        // Simulate tone duration
        await this.sleep(this.config.toneDuration);
    }

    /**
     * Generate DTMF audio samples
     */
    private generateToneSamples(lowFreq: number, highFreq: number): Float32Array {
        const samples = Math.floor(this.config.sampleRate * this.config.toneDuration / 1000);
        const buffer = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const t = i / this.config.sampleRate;
            // Mix two sine waves
            buffer[i] = 0.5 * (
                Math.sin(2 * Math.PI * lowFreq * t) +
                Math.sin(2 * Math.PI * highFreq * t)
            );
        }

        return buffer;
    }

    /**
     * اِسْتَمِع (Istami') - Start listening for DTMF tones
     * From Lisan: "اِسْتَمَعَ - to listen"
     */
    async startListening(): Promise<void> {
        if (this.state === 'yastami') {
            console.warn('[نَغَم] Already listening');
            return;
        }

        this.setState('yastami');
        this.isListening = true;
        this.decodedBuffer = [];

        console.log('[نَغَم] Listening for DTMF tones...');

        // Note: Actual implementation would use microphone input and
        // Goertzel algorithm for DTMF detection

        // For now, this is the interface that would be implemented
        // with react-native-audio-api or expo-av
    }

    /**
     * Process received audio samples for DTMF detection
     */
    processAudioSamples(samples: Float32Array): void {
        if (!this.isListening) return;

        // Goertzel algorithm for DTMF detection
        const detectedTones = this.detectDTMF(samples);

        for (const tone of detectedTones) {
            this.decodedBuffer.push(tone);
            console.log(`[نَغَم] Detected: ${tone}`);

            // Check for complete message
            this.tryDecode();
        }
    }

    /**
     * كَشْف النَّغَم (Kashf al-Nagham) - Detect DTMF using Goertzel algorithm
     * From Lisan: "كَشَفَ - to detect, uncover"
     */
    private detectDTMF(samples: Float32Array): string[] {
        const detected: string[] = [];
        const rowFreqs = [697, 770, 852, 941];
        const colFreqs = [1209, 1336, 1477, 1633];

        // Calculate Goertzel magnitude for each frequency
        const rowMags = rowFreqs.map(f => this.goertzel(samples, f, this.config.sampleRate));
        const colMags = colFreqs.map(f => this.goertzel(samples, f, this.config.sampleRate));

        // Find max row and column
        const maxRow = rowMags.indexOf(Math.max(...rowMags));
        const maxCol = colMags.indexOf(Math.max(...colMags));

        // Threshold check
        const threshold = 0.1;
        if (rowMags[maxRow] > threshold && colMags[maxCol] > threshold) {
            const dtmfGrid = [
                ['1', '2', '3', 'A'],
                ['4', '5', '6', 'B'],
                ['7', '8', '9', 'C'],
                ['*', '0', '#', 'D'],
            ];
            detected.push(dtmfGrid[maxRow][maxCol]);
        }

        return detected;
    }

    /**
     * Goertzel algorithm for single frequency detection
     */
    private goertzel(samples: Float32Array, targetFreq: number, sampleRate: number): number {
        const k = Math.floor(0.5 + (samples.length * targetFreq) / sampleRate);
        const w = (2 * Math.PI * k) / samples.length;
        const coeff = 2 * Math.cos(w);

        let s0 = 0, s1 = 0, s2 = 0;

        for (const sample of samples) {
            s0 = sample + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
        }

        // Return magnitude squared
        return s1 * s1 + s2 * s2 - coeff * s1 * s2;
    }

    /**
     * Try to decode complete message from buffer
     */
    private tryDecode(): void {
        const buffer = this.decodedBuffer.join('');

        // Look for start marker
        const startIdx = buffer.indexOf('**');
        if (startIdx === -1) return;

        // Look for end marker
        const endIdx = buffer.indexOf('##', startIdx + 2);
        if (endIdx === -1) return;

        // Extract message
        const message = buffer.substring(startIdx + 2, endIdx);

        // Parse length (first 4 tones)
        const lenHex = message.substring(0, 4).split('').map(t => DTMF_TO_HEX[t]).join('');
        const dataLen = parseInt(lenHex, 16);

        // Extract data
        const dataHex = message.substring(4, 4 + dataLen);

        // Verify checksum
        const data = dataHex.substring(0, dataHex.length - 4);
        const receivedChecksum = dataHex.substring(dataHex.length - 4);
        const expectedChecksum = this.calculateChecksum(data);

        if (receivedChecksum === expectedChecksum) {
            // Decode and emit
            const json = this.hexToString(data);
            try {
                const payload = JSON.parse(json) as NaghamPayload;
                console.log('[نَغَم] ✓ Decoded payload:', payload.type);
                this.onDecode?.(payload);
                this.emit('decode', payload);
                this.setState('muttasil');
            } catch (e) {
                console.error('[نَغَم] JSON parse error');
            }
        } else {
            console.warn('[نَغَم] Checksum mismatch');
        }

        // Clear buffer
        this.decodedBuffer = [];
    }

    /**
     * Stop listening
     */
    stopListening(): void {
        this.isListening = false;
        this.setState('sakin');
        console.log('[نَغَم] Stopped listening');
    }

    /**
     * Helper: Calculate 4-character checksum
     */
    private calculateChecksum(hex: string): string {
        let sum = 0;
        for (let i = 0; i < hex.length; i += 2) {
            sum += parseInt(hex.substr(i, 2), 16);
        }
        return (sum & 0xFFFF).toString(16).padStart(4, '0');
    }

    /**
     * Helper: String to hex
     */
    private stringToHex(str: string): string {
        return Array.from(str)
            .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Helper: Hex to string
     */
    private hexToString(hex: string): string {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }

    /**
     * Helper: Sleep
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set state with callback
     */
    private setState(state: NaghamState): void {
        this.state = state;
        this.onStateChange?.(state);
        this.emit('stateChange', state);
    }

    /**
     * Get current state
     */
    getState(): NaghamState {
        return this.state;
    }

    /**
     * Create peer exchange payload
     */
    createPeerExchangePayload(peerId: string, publicKeyHex?: string): NaghamPayload {
        return {
            type: 'PEER_EXCHANGE',
            peerId,
            publicKey: publicKeyHex,
            timestamp: Date.now(),
            checksum: '',
        };
    }

    // Event handlers
    setOnStateChange(handler: StateCallback): void {
        this.onStateChange = handler;
    }

    setOnDecode(handler: DecodeCallback): void {
        this.onDecode = handler;
    }

    setOnProgress(handler: ProgressCallback): void {
        this.onProgress = handler;
    }
}

// Singleton export
export const naghamDTMF = new NaghamDTMF();
export default NaghamDTMF;
