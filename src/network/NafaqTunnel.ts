/**
 * نَفَق (Nafaq) - P2P Tunnel System
 * From Lisan al-Arab: "نَفَقَ - to tunnel, bore through, penetrate"
 * 
 * Creates encrypted tunnels over WyreSup P2P connections to:
 * - Forward local ports to remote peers
 * - Bypass firewalls and NAT
 * - Enable GravityRemote-style access
 * 
 * Architecture:
 * ┌─────────────┐    نَفَق Tunnel    ┌─────────────┐
 * │ Local App   │◄──────────────────►│ Remote App  │
 * │ (port 8893) │   via WyreSup P2P  │ (port 8893) │
 * └─────────────┘                    └─────────────┘
 */

import { EventEmitter } from 'events';
import TcpSocket from 'react-native-tcp-socket';

/**
 * حَالَة النَّفَق (Halat al-Nafaq) - Tunnel State
 */
export type TunnelState = 'mughlag' | 'yaftah' | 'maftuh' | 'muqta';
// مُغْلَق (closed) | يَفْتَح (opening) | مَفْتُوح (open) | مُقْطَع (error)

/**
 * تَكْوِين النَّفَق (Takwin al-Nafaq) - Tunnel Configuration
 */
export interface TunnelConfig {
    id: string;
    name: string;
    localPort: number;        // Local listen port
    remotePort: number;       // Remote target port
    remotePeerId: string;     // WyreSup peer to connect to
    encrypted: boolean;       // Use Miftah encryption
    bidirectional: boolean;   // Allow reverse connections
}

export interface TunnelStats {
    bytesIn: number;
    bytesOut: number;
    connections: number;
    activeConnections: number;
    errors: number;
    uptime: number; // seconds
}

interface ActiveConnection {
    id: string;
    socket: any;
    tunnelId: string;
    direction: 'inbound' | 'outbound';
    buffer: Buffer[];
}

type TunnelCallback = (tunnel: TunnelConfig, state: TunnelState) => void;
type DataCallback = (tunnelId: string, data: Buffer) => void;

class NafaqTunnel extends EventEmitter {
    private tunnels: Map<string, TunnelConfig> = new Map();
    private tunnelStates: Map<string, TunnelState> = new Map();
    private tunnelStats: Map<string, TunnelStats> = new Map();
    private servers: Map<string, any> = new Map(); // TCP servers for listening
    private connections: Map<string, ActiveConnection> = new Map();
    private tunnelStartTimes: Map<string, number> = new Map();

    // وَصْل (Wasl) - Connection to WyreSup relay for data forwarding
    private wysRelaySend?: (data: any) => boolean;

    private onStateChange?: TunnelCallback;
    private onData?: DataCallback;

    constructor() {
        super();
        console.log('[نَفَق] Nafaq tunnel system initialized');
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with WyreSup relay send function
     */
    initialize(relaySend: (data: any) => boolean): void {
        this.wysRelaySend = relaySend;
        console.log('[نَفَق] Initialized with WyreSup relay');
    }

    /**
     * أَنْشِئ نَفَق (Anshi' Nafaq) - Create a new tunnel
     * From Lisan: "أَنْشَأَ - to create, establish"
     */
    createTunnel(config: Omit<TunnelConfig, 'id'>): string {
        const id = `nafaq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const tunnel: TunnelConfig = {
            ...config,
            id,
        };

        this.tunnels.set(id, tunnel);
        this.tunnelStates.set(id, 'mughlag');
        this.tunnelStats.set(id, {
            bytesIn: 0,
            bytesOut: 0,
            connections: 0,
            activeConnections: 0,
            errors: 0,
            uptime: 0,
        });

        console.log(`[نَفَق] Created tunnel: ${config.name} (${config.localPort} → ${config.remotePeerId}:${config.remotePort})`);
        return id;
    }

    /**
     * إِفْتَح النَّفَق (Iftah al-Nafaq) - Open/start the tunnel
     * From Lisan: "فَتَحَ - to open"
     */
    async openTunnel(tunnelId: string): Promise<boolean> {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) {
            console.error(`[نَفَق] Tunnel not found: ${tunnelId}`);
            return false;
        }

        const currentState = this.tunnelStates.get(tunnelId);
        if (currentState === 'maftuh' || currentState === 'yaftah') {
            console.log(`[نَفَق] Tunnel already open/opening: ${tunnel.name}`);
            return true;
        }

        this.setTunnelState(tunnelId, 'yaftah');
        console.log(`[نَفَق] Opening tunnel: ${tunnel.name}`);

        try {
            // Create local TCP server to accept connections
            const server = TcpSocket.createServer((socket: any) => {
                this.handleIncomingConnection(tunnelId, socket);
            });

            await new Promise<void>((resolve, reject) => {
                server.listen({ port: tunnel.localPort, host: '0.0.0.0' }, () => {
                    console.log(`[نَفَق] ✓ Listening on port ${tunnel.localPort}`);
                    resolve();
                });

                server.on('error', (err: Error) => {
                    console.error(`[نَفَق] Server error: ${err.message}`);
                    reject(err);
                });
            });

            this.servers.set(tunnelId, server);
            this.tunnelStartTimes.set(tunnelId, Date.now());
            this.setTunnelState(tunnelId, 'maftuh');

            // Notify remote peer that tunnel is ready
            this.notifyRemotePeer(tunnel, 'NAFAQ_READY');

            return true;
        } catch (error: any) {
            console.error(`[نَفَق] Failed to open tunnel: ${error.message}`);
            this.setTunnelState(tunnelId, 'muqta');
            return false;
        }
    }

    /**
     * Handle incoming local connection
     */
    private handleIncomingConnection(tunnelId: string, socket: any): void {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) return;

        const connId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        const connection: ActiveConnection = {
            id: connId,
            socket,
            tunnelId,
            direction: 'inbound',
            buffer: [],
        };

        this.connections.set(connId, connection);
        this.updateStats(tunnelId, 'connections', 1);
        this.updateStats(tunnelId, 'activeConnections', 1);

        console.log(`[نَفَق] New connection: ${connId} on tunnel ${tunnel.name}`);

        // Notify remote peer of new connection
        this.sendToRemote(tunnel.remotePeerId, {
            type: 'NAFAQ_CONNECT',
            tunnelId,
            connectionId: connId,
            remotePort: tunnel.remotePort,
        });

        socket.on('data', (data: Buffer) => {
            this.handleLocalData(connId, data);
        });

        socket.on('close', () => {
            console.log(`[نَفَق] Connection closed: ${connId}`);
            this.connections.delete(connId);
            this.updateStats(tunnelId, 'activeConnections', -1);

            // Notify remote peer
            this.sendToRemote(tunnel.remotePeerId, {
                type: 'NAFAQ_DISCONNECT',
                tunnelId,
                connectionId: connId,
            });
        });

        socket.on('error', (err: Error) => {
            console.error(`[نَفَق] Connection error: ${err.message}`);
            this.updateStats(tunnelId, 'errors', 1);
        });
    }

    /**
     * Handle local data - forward to remote via WyreSup
     */
    private handleLocalData(connectionId: string, data: Buffer): void {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const tunnel = this.tunnels.get(connection.tunnelId);
        if (!tunnel) return;

        // Convert to base64 for JSON transport
        const base64Data = data.toString('base64');

        this.sendToRemote(tunnel.remotePeerId, {
            type: 'NAFAQ_DATA',
            tunnelId: connection.tunnelId,
            connectionId,
            data: base64Data,
            size: data.length,
        });

        this.updateStats(connection.tunnelId, 'bytesOut', data.length);
    }

    /**
     * اِسْتَقْبِل مِن البَعِيد (Istaqbil min al-Ba'id) - Receive from remote peer
     * Handle incoming WyreSup messages for tunnel operations
     */
    handleRemoteMessage(from: string, message: any): void {
        switch (message.type) {
            case 'NAFAQ_READY':
                console.log(`[نَفَق] Remote tunnel ready from ${from}`);
                break;

            case 'NAFAQ_CONNECT':
                this.handleRemoteConnect(from, message);
                break;

            case 'NAFAQ_DATA':
                this.handleRemoteData(message);
                break;

            case 'NAFAQ_DISCONNECT':
                this.handleRemoteDisconnect(message);
                break;

            case 'NAFAQ_RESPONSE':
                this.handleRemoteResponse(message);
                break;
        }
    }

    /**
     * Handle remote connection request - connect to local target
     */
    private async handleRemoteConnect(from: string, message: any): Promise<void> {
        const { tunnelId, connectionId, remotePort } = message;

        console.log(`[نَفَق] Remote connect request: ${connectionId} → localhost:${remotePort}`);

        try {
            // Connect to local target port
            const socket = TcpSocket.createConnection(
                { host: '127.0.0.1', port: remotePort },
                () => {
                    console.log(`[نَفَق] Connected to localhost:${remotePort}`);

                    const connection: ActiveConnection = {
                        id: connectionId,
                        socket,
                        tunnelId,
                        direction: 'outbound',
                        buffer: [],
                    };

                    this.connections.set(connectionId, connection);
                }
            );

            socket.on('data', (data: Buffer) => {
                // Send data back to remote
                const base64Data = data.toString('base64');
                this.sendToRemote(from, {
                    type: 'NAFAQ_RESPONSE',
                    tunnelId,
                    connectionId,
                    data: base64Data,
                    size: data.length,
                });
            });

            socket.on('close', () => {
                this.connections.delete(connectionId);
            });

            socket.on('error', (err: Error) => {
                console.error(`[نَفَق] Local connection error: ${err.message}`);
            });
        } catch (error: any) {
            console.error(`[نَفَق] Failed to connect locally: ${error.message}`);
        }
    }

    /**
     * Handle remote data - write to local socket
     */
    private handleRemoteData(message: any): void {
        const { connectionId, data } = message;
        const connection = this.connections.get(connectionId);

        if (connection?.socket) {
            const buffer = Buffer.from(data, 'base64');
            connection.socket.write(buffer);
            this.updateStats(connection.tunnelId, 'bytesIn', buffer.length);
        }
    }

    /**
     * Handle remote response - write to local socket
     */
    private handleRemoteResponse(message: any): void {
        const { connectionId, data } = message;
        const connection = this.connections.get(connectionId);

        if (connection?.socket) {
            const buffer = Buffer.from(data, 'base64');
            connection.socket.write(buffer);
            this.updateStats(connection.tunnelId, 'bytesIn', buffer.length);
        }
    }

    /**
     * Handle remote disconnect
     */
    private handleRemoteDisconnect(message: any): void {
        const { connectionId } = message;
        const connection = this.connections.get(connectionId);

        if (connection?.socket) {
            connection.socket.destroy();
            this.connections.delete(connectionId);
        }
    }

    /**
     * Send message to remote peer via WyreSup
     */
    private sendToRemote(peerId: string, data: any): void {
        if (this.wysRelaySend) {
            this.wysRelaySend({
                type: 'MSG',
                to: peerId,
                content: JSON.stringify(data),
                encrypted: true,
            });
        }
    }

    /**
     * Notify remote peer of tunnel status
     */
    private notifyRemotePeer(tunnel: TunnelConfig, type: string): void {
        this.sendToRemote(tunnel.remotePeerId, {
            type,
            tunnelId: tunnel.id,
            name: tunnel.name,
            port: tunnel.remotePort,
        });
    }

    /**
     * أَغْلِق النَّفَق (Aghliq al-Nafaq) - Close the tunnel
     * From Lisan: "أَغْلَقَ - to close, shut"
     */
    closeTunnel(tunnelId: string): void {
        const tunnel = this.tunnels.get(tunnelId);
        if (!tunnel) return;

        console.log(`[نَفَق] Closing tunnel: ${tunnel.name}`);

        // Close all connections for this tunnel
        for (const [connId, conn] of this.connections) {
            if (conn.tunnelId === tunnelId) {
                conn.socket?.destroy();
                this.connections.delete(connId);
            }
        }

        // Close the server
        const server = this.servers.get(tunnelId);
        if (server) {
            server.close();
            this.servers.delete(tunnelId);
        }

        // Notify remote peer
        this.notifyRemotePeer(tunnel, 'NAFAQ_CLOSED');

        this.setTunnelState(tunnelId, 'mughlag');
    }

    /**
     * Delete tunnel completely
     */
    deleteTunnel(tunnelId: string): void {
        this.closeTunnel(tunnelId);
        this.tunnels.delete(tunnelId);
        this.tunnelStates.delete(tunnelId);
        this.tunnelStats.delete(tunnelId);
        this.tunnelStartTimes.delete(tunnelId);
    }

    /**
     * Set tunnel state with callback
     */
    private setTunnelState(tunnelId: string, state: TunnelState): void {
        this.tunnelStates.set(tunnelId, state);
        const tunnel = this.tunnels.get(tunnelId);
        if (tunnel) {
            this.onStateChange?.(tunnel, state);
            this.emit('stateChange', tunnel, state);
        }
    }

    /**
     * Update tunnel statistics
     */
    private updateStats(tunnelId: string, field: keyof TunnelStats, delta: number): void {
        const stats = this.tunnelStats.get(tunnelId);
        if (stats) {
            (stats[field] as number) += delta;
        }
    }

    // Getters
    getTunnel(tunnelId: string): TunnelConfig | undefined {
        return this.tunnels.get(tunnelId);
    }

    getAllTunnels(): TunnelConfig[] {
        return Array.from(this.tunnels.values());
    }

    getTunnelState(tunnelId: string): TunnelState | undefined {
        return this.tunnelStates.get(tunnelId);
    }

    getTunnelStats(tunnelId: string): TunnelStats | undefined {
        const stats = this.tunnelStats.get(tunnelId);
        if (stats) {
            const startTime = this.tunnelStartTimes.get(tunnelId);
            if (startTime) {
                stats.uptime = Math.floor((Date.now() - startTime) / 1000);
            }
        }
        return stats;
    }

    // Event handlers
    setOnStateChange(handler: TunnelCallback): void {
        this.onStateChange = handler;
    }

    setOnData(handler: DataCallback): void {
        this.onData = handler;
    }
}

// Singleton export
export const nafaqTunnel = new NafaqTunnel();
export default NafaqTunnel;
