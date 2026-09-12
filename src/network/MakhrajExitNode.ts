/**
 * مَخْرَج (Makhraj) - Exit Node Handler
 * From Lisan al-Arab: "مَخْرَج - exit point, outlet"
 * 
 * Handles incoming proxy requests from remote peers and makes
 * actual TCP connections to the internet.
 * 
 * This runs on the peer that has internet access.
 */

import { EventEmitter } from 'events';
import TcpSocket from 'react-native-tcp-socket';

interface OutboundConnection {
    id: string;
    fromPeer: string;
    host: string;
    port: number;
    socket: any;
    bytesIn: number;
    bytesOut: number;
}

export interface MakhrajStats {
    totalConnections: number;
    activeConnections: number;
    bytesIn: number;
    bytesOut: number;
    errors: number;
}

class MakhrajExitNode extends EventEmitter {
    private connections: Map<string, OutboundConnection> = new Map();
    private stats: MakhrajStats = {
        totalConnections: 0,
        activeConnections: 0,
        bytesIn: 0,
        bytesOut: 0,
        errors: 0,
    };

    // Send function back to WyreSup
    private relaySend?: (data: any) => boolean;

    // Allowed domains (optional security)
    private allowedDomains?: string[];
    private blockedDomains?: string[];

    constructor() {
        super();
        console.log('[مَخْرَج] Makhraj exit node initialized');
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with relay send function
     */
    initialize(relaySend: (data: any) => boolean): void {
        this.relaySend = relaySend;
    }

    /**
     * Configure allowed/blocked domains
     */
    configure(options: { allowed?: string[]; blocked?: string[] }): void {
        this.allowedDomains = options.allowed;
        this.blockedDomains = options.blocked;
    }

    /**
     * اِسْتَقْبِل (Istaqbil) - Handle incoming proxy request
     */
    handleMessage(fromPeer: string, message: any): void {
        switch (message.type) {
            case 'WAKIL_CONNECT':
                this.handleConnect(fromPeer, message);
                break;

            case 'WAKIL_DATA':
                this.handleData(message);
                break;

            case 'WAKIL_DISCONNECT':
                this.handleDisconnect(message);
                break;
        }
    }

    /**
     * وَصْل (Wasl) - Handle connection request
     */
    private async handleConnect(fromPeer: string, message: any): Promise<void> {
        const { connectionId, host, port } = message;

        console.log(`[مَخْرَج] Connect request: ${host}:${port} from ${fromPeer}`);

        // Security check
        if (!this.isAllowed(host)) {
            console.log(`[مَخْرَج] Blocked: ${host}`);
            this.sendError(fromPeer, connectionId, 'BLOCKED');
            return;
        }

        try {
            // Create actual TCP connection to target
            const socket = TcpSocket.createConnection(
                { host, port },
                () => {
                    console.log(`[مَخْرَج] ✓ Connected to ${host}:${port}`);

                    const conn: OutboundConnection = {
                        id: connectionId,
                        fromPeer,
                        host,
                        port,
                        socket,
                        bytesIn: 0,
                        bytesOut: 0,
                    };

                    this.connections.set(connectionId, conn);
                    this.stats.totalConnections++;
                    this.stats.activeConnections++;

                    // Send ACK back
                    this.sendToRemote(fromPeer, {
                        type: 'WAKIL_CONNECT_ACK',
                        connectionId,
                        success: true,
                    });
                }
            );

            socket.on('data', (data: Buffer) => {
                this.handleOutboundData(connectionId, data);
            });

            socket.on('close', () => {
                this.closeConnection(connectionId, fromPeer);
            });

            socket.on('error', (err: Error) => {
                console.error(`[مَخْرَج] Connection error: ${err.message}`);
                this.stats.errors++;
                this.sendError(fromPeer, connectionId, err.message);
                this.closeConnection(connectionId, fromPeer);
            });
        } catch (error: any) {
            console.error(`[مَخْرَج] Failed to connect: ${error.message}`);
            this.sendError(fromPeer, connectionId, error.message);
        }
    }

    /**
     * Handle incoming data from proxy client
     */
    private handleData(message: any): void {
        const conn = this.connections.get(message.connectionId);
        if (!conn?.socket) return;

        const data = Buffer.from(message.data, 'base64');
        conn.socket.write(data);
        conn.bytesOut += data.length;
        this.stats.bytesOut += data.length;
    }

    /**
     * Handle data received from target server
     */
    private handleOutboundData(connectionId: string, data: Buffer): void {
        const conn = this.connections.get(connectionId);
        if (!conn) return;

        conn.bytesIn += data.length;
        this.stats.bytesIn += data.length;

        // Send back to proxy client via WyreSup
        this.sendToRemote(conn.fromPeer, {
            type: 'WAKIL_DATA_RESPONSE',
            connectionId,
            data: data.toString('base64'),
        });
    }

    /**
     * Handle disconnect request
     */
    private handleDisconnect(message: any): void {
        const conn = this.connections.get(message.connectionId);
        if (conn) {
            this.closeConnection(message.connectionId, conn.fromPeer);
        }
    }

    /**
     * Check if domain is allowed
     */
    private isAllowed(host: string): boolean {
        // Check blocklist
        if (this.blockedDomains?.some(d => host.includes(d))) {
            return false;
        }

        // Check allowlist
        if (this.allowedDomains && this.allowedDomains.length > 0) {
            return this.allowedDomains.some(d => host.includes(d));
        }

        return true;
    }

    /**
     * Close connection and cleanup
     */
    private closeConnection(connectionId: string, fromPeer: string): void {
        const conn = this.connections.get(connectionId);
        if (conn) {
            conn.socket?.destroy();
            this.connections.delete(connectionId);
            this.stats.activeConnections--;

            console.log(`[مَخْرَج] Closed: ${conn.host}:${conn.port}`);
        }
    }

    /**
     * Send message to remote peer
     */
    private sendToRemote(peerId: string, data: any): void {
        if (this.relaySend) {
            this.relaySend({
                ...data,
                to: peerId,
            });
        }
    }

    /**
     * Send error to remote peer
     */
    private sendError(peerId: string, connectionId: string, error: string): void {
        this.sendToRemote(peerId, {
            type: 'WAKIL_ERROR',
            connectionId,
            error,
        });
    }

    /**
     * Get stats
     */
    getStats(): MakhrajStats {
        return { ...this.stats };
    }

    /**
     * Get active connections
     */
    getActiveConnections(): Array<{ host: string; port: number; bytesIn: number; bytesOut: number }> {
        return Array.from(this.connections.values()).map(c => ({
            host: c.host,
            port: c.port,
            bytesIn: c.bytesIn,
            bytesOut: c.bytesOut,
        }));
    }

    /**
     * Shutdown all connections
     */
    shutdown(): void {
        console.log('[مَخْرَج] Shutting down');
        for (const [id, conn] of this.connections) {
            conn.socket?.destroy();
        }
        this.connections.clear();
        this.stats.activeConnections = 0;
    }
}

// Singleton export
export const makhrajExitNode = new MakhrajExitNode();
export default MakhrajExitNode;
