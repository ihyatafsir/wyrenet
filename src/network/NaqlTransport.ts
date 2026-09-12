/**
 * نَقْل (Naql) - Transport Layer
 * From Lisan al-Arab: "نَقَلَ - to transport, transfer, convey"
 * 
 * Unified transport layer that selects optimal connection path:
 * - TCP (مُسْتَضِيف/مُتَّصِل) for direct connections
 * - WebSocket for relay-based connections
 * - BLE for nearby discovery (future)
 * 
 * Implements سَيْل (Sayl) - Flow/stream management
 */

import { EventEmitter } from 'events';

/**
 * طَريق النَّقْل (Tariq al-Naql) - Transport Path
 */
export type TransportPath = 'tcp' | 'ws' | 'ble' | 'none';

/**
 * جَوْدَة الطَّريق (Jawdat al-Tariq) - Path Quality
 */
export interface PathQuality {
    path: TransportPath;
    latency: number; // ms
    bandwidth: number; // bytes/sec
    reliability: number; // 0-1
    score: number; // Combined quality score
}

export interface TransportStats {
    bytesSent: number;
    bytesReceived: number;
    messagesSent: number;
    messagesReceived: number;
    errors: number;
    reconnects: number;
}

type MessageCallback = (from: string, data: any) => void;
type PathChangeCallback = (oldPath: TransportPath, newPath: TransportPath) => void;

class NaqlTransport extends EventEmitter {
    private activePath: TransportPath = 'none';
    private pathQualities: Map<TransportPath, PathQuality> = new Map();
    private stats: TransportStats = {
        bytesSent: 0,
        bytesReceived: 0,
        messagesSent: 0,
        messagesReceived: 0,
        errors: 0,
        reconnects: 0,
    };

    // Transport references
    private tcpSend?: (data: any) => boolean;
    private wsSend?: (data: any) => boolean;
    private bleSend?: (data: any) => boolean;

    private onMessage?: MessageCallback;
    private onPathChange?: PathChangeCallback;

    // سَيْل (Sayl) - Flow control
    private flowWindow = 10; // Max pending messages
    private pendingMessages: any[] = [];
    private isFlowing = true;

    constructor() {
        super();
        console.log('[نَقْل] Naql transport layer initialized');

        // Initialize path qualities with defaults
        this.pathQualities.set('tcp', {
            path: 'tcp',
            latency: 999,
            bandwidth: 0,
            reliability: 0,
            score: 0,
        });
        this.pathQualities.set('ws', {
            path: 'ws',
            latency: 999,
            bandwidth: 0,
            reliability: 0,
            score: 0,
        });
    }

    /**
     * تَسْجِيل طَريق (Tasjil Tariq) - Register transport path
     */
    registerPath(
        path: TransportPath,
        sendFn: (data: any) => boolean
    ): void {
        switch (path) {
            case 'tcp':
                this.tcpSend = sendFn;
                break;
            case 'ws':
                this.wsSend = sendFn;
                break;
            case 'ble':
                this.bleSend = sendFn;
                break;
        }
        console.log(`[نَقْل] Registered path: ${path}`);
        this.updateOptimalPath();
    }

    /**
     * تَحْدِيث جَوْدَة (Tahdith Jawda) - Update path quality metrics
     */
    updatePathQuality(path: TransportPath, latency: number, isConnected: boolean): void {
        const quality = this.pathQualities.get(path);
        if (quality) {
            quality.latency = latency;
            quality.reliability = isConnected ? 0.9 : 0;
            quality.bandwidth = isConnected ? 100000 : 0; // Estimate
            quality.score = this.calculateScore(quality);
            this.pathQualities.set(path, quality);
        }
        this.updateOptimalPath();
    }

    /**
     * Calculate path quality score
     * Lower latency and higher reliability = higher score
     */
    private calculateScore(quality: PathQuality): number {
        if (quality.reliability === 0) return 0;

        // Score formula: reliability * (1000 / latency) * bandwidth_factor
        const latencyScore = quality.latency > 0 ? (1000 / quality.latency) : 1;
        const bandwidthFactor = Math.min(quality.bandwidth / 50000, 2); // Cap at 2x

        return quality.reliability * latencyScore * bandwidthFactor;
    }

    /**
     * اِخْتِيار أَفْضَل (Ikhtiyar Afdal) - Select optimal path
     */
    private updateOptimalPath(): void {
        let bestPath: TransportPath = 'none';
        let bestScore = 0;

        for (const [path, quality] of this.pathQualities) {
            if (quality.score > bestScore && this.hasPath(path)) {
                bestScore = quality.score;
                bestPath = path;
            }
        }

        if (bestPath !== this.activePath) {
            const oldPath = this.activePath;
            this.activePath = bestPath;
            console.log(`[نَقْل] Path changed: ${oldPath} → ${bestPath} (score: ${bestScore.toFixed(2)})`);
            this.onPathChange?.(oldPath, bestPath);
            this.emit('pathChange', oldPath, bestPath);
        }
    }

    /**
     * Check if path has registered send function
     */
    private hasPath(path: TransportPath): boolean {
        switch (path) {
            case 'tcp': return !!this.tcpSend;
            case 'ws': return !!this.wsSend;
            case 'ble': return !!this.bleSend;
            default: return false;
        }
    }

    /**
     * أَرْسِل (Arsil) - Send data via optimal path
     * From Lisan: "أَرْسَلَ - to send"
     */
    send(data: any): boolean {
        // سَيْل (Sayl) - Flow control
        if (!this.isFlowing && this.pendingMessages.length >= this.flowWindow) {
            console.warn('[نَقْل] Flow control: message queued');
            this.pendingMessages.push(data);
            return false;
        }

        let success = false;
        const serialized = JSON.stringify(data);

        switch (this.activePath) {
            case 'tcp':
                success = this.tcpSend?.(data) || false;
                break;
            case 'ws':
                success = this.wsSend?.(data) || false;
                break;
            case 'ble':
                success = this.bleSend?.(data) || false;
                break;
            default:
                console.warn('[نَقْل] No active path, message dropped');
                this.stats.errors++;
                return false;
        }

        if (success) {
            this.stats.messagesSent++;
            this.stats.bytesSent += serialized.length;
        } else {
            this.stats.errors++;
            // Try fallback path
            success = this.sendViaFallback(data);
        }

        return success;
    }

    /**
     * Send via fallback path if primary fails
     */
    private sendViaFallback(data: any): boolean {
        const paths: TransportPath[] = ['tcp', 'ws', 'ble'];

        for (const path of paths) {
            if (path !== this.activePath && this.hasPath(path)) {
                let success = false;
                switch (path) {
                    case 'tcp':
                        success = this.tcpSend?.(data) || false;
                        break;
                    case 'ws':
                        success = this.wsSend?.(data) || false;
                        break;
                    case 'ble':
                        success = this.bleSend?.(data) || false;
                        break;
                }
                if (success) {
                    console.log(`[نَقْل] Sent via fallback path: ${path}`);
                    this.stats.messagesSent++;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * اِسْتَقْبِل (Istaqbil) - Handle received data
     * From Lisan: "اِسْتَقْبَلَ - to receive, face"
     */
    receive(from: string, data: any, viaPath: TransportPath): void {
        this.stats.messagesReceived++;
        this.stats.bytesReceived += JSON.stringify(data).length;

        this.onMessage?.(from, data);
        this.emit('message', from, data, viaPath);
    }

    /**
     * سَيْل (Sayl) - Flow control
     * Pause/resume message flow for backpressure handling
     */
    pauseFlow(): void {
        this.isFlowing = false;
        console.log('[نَقْل] سَيْل paused');
    }

    resumeFlow(): void {
        this.isFlowing = true;
        console.log('[نَقْل] سَيْل resumed');

        // Drain pending messages
        while (this.pendingMessages.length > 0 && this.isFlowing) {
            const msg = this.pendingMessages.shift();
            this.send(msg);
        }
    }

    /**
     * Get current active path
     */
    getActivePath(): TransportPath {
        return this.activePath;
    }

    /**
     * Get transport statistics
     */
    getStats(): TransportStats {
        return { ...this.stats };
    }

    /**
     * Get path quality info
     */
    getPathQuality(path: TransportPath): PathQuality | undefined {
        return this.pathQualities.get(path);
    }

    /**
     * Get all path qualities for UI display
     */
    getAllPathQualities(): PathQuality[] {
        return Array.from(this.pathQualities.values());
    }

    // Event handlers
    setOnMessage(handler: MessageCallback): void {
        this.onMessage = handler;
    }

    setOnPathChange(handler: PathChangeCallback): void {
        this.onPathChange = handler;
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            bytesSent: 0,
            bytesReceived: 0,
            messagesSent: 0,
            messagesReceived: 0,
            errors: 0,
            reconnects: 0,
        };
    }
}

// Singleton export
export const naqlTransport = new NaqlTransport();
export default NaqlTransport;
