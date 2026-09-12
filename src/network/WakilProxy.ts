/**
 * وَكِيل (Wakil) - SOCKS5 Proxy for VPN-Like Routing
 * From Lisan al-Arab: "وَكِيل - agent, proxy, deputy"
 * 
 * Makes WyreSup tunnels VPN-like by:
 * 1. Running a local SOCKS5 proxy server
 * 2. Apps connect to localhost:1080 (SOCKS)
 * 3. All requests route through WyreSup P2P to remote peer
 * 4. Remote peer makes the actual connection
 * 
 * Architecture:
 * ┌─────────┐    SOCKS5    ┌─────────┐    P2P     ┌─────────┐    TCP    ┌──────────┐
 * │ Browser │────────────►│  Wakil  │───────────►│ Remote  │──────────►│ Internet │
 * │  App    │◄────────────│ (local) │◄───────────│  Peer   │◄──────────│          │
 * └─────────┘             └─────────┘            └─────────┘           └──────────┘
 * 
 * Usage:
 * 1. Phone A runs Wakil proxy on port 1080
 * 2. Phone A connects to Phone B via WyreSup
 * 3. Configure apps to use SOCKS5 proxy localhost:1080
 * 4. All traffic routes through Phone B's internet
 */

import { EventEmitter } from 'events';
import TcpSocket from 'react-native-tcp-socket';

// SOCKS5 Constants
const SOCKS_VERSION = 0x05;
const SOCKS_AUTH_NONE = 0x00;
const SOCKS_CMD_CONNECT = 0x01;
const SOCKS_ATYP_IPV4 = 0x01;
const SOCKS_ATYP_DOMAIN = 0x03;
const SOCKS_ATYP_IPV6 = 0x04;
const SOCKS_REP_SUCCESS = 0x00;
const SOCKS_REP_FAILURE = 0x01;

/**
 * حَالَة الوَكِيل (Halat al-Wakil) - Proxy State
 */
export type WakilState = 'mutawwaqif' | 'yashtaghil' | 'khata';
// مُتَوَقِّف (stopped) | يَشْتَغِل (running) | خَطَأ (error)

export interface WakilConfig {
    listenPort: number;       // Local SOCKS5 port (default 1080)
    remotePeerId: string;     // WyreSup peer to route through
    allowedHosts?: string[];  // Optional whitelist
    blockedHosts?: string[];  // Optional blacklist
    maxConnections?: number;
}

export interface WakilStats {
    totalConnections: number;
    activeConnections: number;
    bytesIn: number;
    bytesOut: number;
    domainsResolved: number;
    errors: number;
    uptime: number;
}

interface ProxyConnection {
    id: string;
    clientSocket: any;
    targetHost: string;
    targetPort: number;
    state: 'handshake' | 'request' | 'connected' | 'closed';
    buffer: Buffer[];
}

type StateCallback = (state: WakilState) => void;
type ConnectionCallback = (host: string, port: number) => void;

class WakilProxy extends EventEmitter {
    private state: WakilState = 'mutawwaqif';
    private config: WakilConfig | null = null;
    private server: any = null;
    private connections: Map<string, ProxyConnection> = new Map();
    private startTime: number = 0;
    private stats: WakilStats = {
        totalConnections: 0,
        activeConnections: 0,
        bytesIn: 0,
        bytesOut: 0,
        domainsResolved: 0,
        errors: 0,
        uptime: 0,
    };

    // وَصْل (Wasl) - Connection to WyreSup for routing
    private relaySend?: (data: any) => boolean;

    private onStateChange?: StateCallback;
    private onNewConnection?: ConnectionCallback;

    constructor() {
        super();
        console.log('[وَكِيل] Wakil SOCKS5 proxy initialized');
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with WyreSup relay
     */
    initialize(relaySend: (data: any) => boolean): void {
        this.relaySend = relaySend;
    }

    /**
     * شَغِّل (Shaghghil) - Start the SOCKS5 proxy
     * From Lisan: "شَغَّلَ - to operate, run"
     */
    async start(config: WakilConfig): Promise<boolean> {
        if (this.state === 'yashtaghil') {
            console.warn('[وَكِيل] Already running');
            return true;
        }

        this.config = config;
        console.log(`[وَكِيل] Starting SOCKS5 proxy on port ${config.listenPort}`);

        try {
            this.server = TcpSocket.createServer((socket: any) => {
                this.handleNewConnection(socket);
            });

            await new Promise<void>((resolve, reject) => {
                this.server.listen({ port: config.listenPort, host: '127.0.0.1' }, () => {
                    console.log(`[وَكِيل] ✓ SOCKS5 listening on 127.0.0.1:${config.listenPort}`);
                    resolve();
                });

                this.server.on('error', (err: Error) => {
                    console.error(`[وَكِيل] Server error: ${err.message}`);
                    reject(err);
                });
            });

            this.state = 'yashtaghil';
            this.startTime = Date.now();
            this.onStateChange?.(this.state);
            this.emit('stateChange', this.state);

            return true;
        } catch (error: any) {
            console.error(`[وَكِيل] Failed to start: ${error.message}`);
            this.state = 'khata';
            this.onStateChange?.(this.state);
            return false;
        }
    }

    /**
     * Handle new SOCKS5 connection
     */
    private handleNewConnection(socket: any): void {
        const connId = `wakil_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        const conn: ProxyConnection = {
            id: connId,
            clientSocket: socket,
            targetHost: '',
            targetPort: 0,
            state: 'handshake',
            buffer: [],
        };

        this.connections.set(connId, conn);
        this.stats.totalConnections++;
        this.stats.activeConnections++;

        console.log(`[وَكِيل] New connection: ${connId}`);

        socket.on('data', (data: Buffer) => {
            this.handleData(connId, data);
        });

        socket.on('close', () => {
            this.closeConnection(connId);
        });

        socket.on('error', (err: Error) => {
            console.error(`[وَكِيل] Socket error: ${err.message}`);
            this.stats.errors++;
            this.closeConnection(connId);
        });
    }

    /**
     * Handle SOCKS5 protocol data
     */
    private handleData(connId: string, data: Buffer): void {
        const conn = this.connections.get(connId);
        if (!conn) return;

        this.stats.bytesIn += data.length;

        switch (conn.state) {
            case 'handshake':
                this.handleHandshake(conn, data);
                break;
            case 'request':
                this.handleRequest(conn, data);
                break;
            case 'connected':
                this.forwardToRemote(conn, data);
                break;
        }
    }

    /**
     * مُصَافَحَة (Musafaha) - SOCKS5 Handshake
     * Client sends: VER | NMETHODS | METHODS
     */
    private handleHandshake(conn: ProxyConnection, data: Buffer): void {
        if (data.length < 3) return;

        const version = data[0];
        if (version !== SOCKS_VERSION) {
            console.warn(`[وَكِيل] Invalid SOCKS version: ${version}`);
            this.closeConnection(conn.id);
            return;
        }

        // Accept no-auth method
        const response = Buffer.from([SOCKS_VERSION, SOCKS_AUTH_NONE]);
        conn.clientSocket.write(response);
        conn.state = 'request';
    }

    /**
     * طَلَب (Talab) - Handle SOCKS5 connect request
     * Client sends: VER | CMD | RSV | ATYP | DST.ADDR | DST.PORT
     */
    private handleRequest(conn: ProxyConnection, data: Buffer): void {
        if (data.length < 7) return;

        const version = data[0];
        const cmd = data[1];
        const atyp = data[3];

        if (version !== SOCKS_VERSION || cmd !== SOCKS_CMD_CONNECT) {
            this.sendError(conn, SOCKS_REP_FAILURE);
            return;
        }

        let host = '';
        let portOffset = 0;

        switch (atyp) {
            case SOCKS_ATYP_IPV4:
                // IPv4: 4 bytes
                host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
                portOffset = 8;
                break;

            case SOCKS_ATYP_DOMAIN:
                // Domain: 1 byte length + domain
                const domainLen = data[4];
                host = data.slice(5, 5 + domainLen).toString();
                portOffset = 5 + domainLen;
                this.stats.domainsResolved++;
                break;

            case SOCKS_ATYP_IPV6:
                // IPv6: 16 bytes (simplified)
                host = 'ipv6';
                portOffset = 20;
                break;

            default:
                this.sendError(conn, SOCKS_REP_FAILURE);
                return;
        }

        const port = data.readUInt16BE(portOffset);
        conn.targetHost = host;
        conn.targetPort = port;

        console.log(`[وَكِيل] Connect request: ${host}:${port}`);

        // Check allowed/blocked lists
        if (!this.isAllowed(host)) {
            console.log(`[وَكِيل] Blocked: ${host}`);
            this.sendError(conn, SOCKS_REP_FAILURE);
            return;
        }

        this.onNewConnection?.(host, port);
        this.emit('connection', host, port);

        // Route through WyreSup P2P
        this.initiateRemoteConnection(conn);
    }

    /**
     * Check if host is allowed
     */
    private isAllowed(host: string): boolean {
        if (!this.config) return false;

        // Check blocklist first
        if (this.config.blockedHosts?.some(b => host.includes(b))) {
            return false;
        }

        // If whitelist exists, must be in it
        if (this.config.allowedHosts && this.config.allowedHosts.length > 0) {
            return this.config.allowedHosts.some(a => host.includes(a));
        }

        return true;
    }

    /**
     * وَصْل البَعِيد (Wasl al-Ba'id) - Initiate remote connection
     */
    private initiateRemoteConnection(conn: ProxyConnection): void {
        if (!this.relaySend || !this.config) {
            this.sendError(conn, SOCKS_REP_FAILURE);
            return;
        }

        // Send connection request to remote peer via WyreSup
        this.relaySend({
            type: 'WAKIL_CONNECT',
            connectionId: conn.id,
            host: conn.targetHost,
            port: conn.targetPort,
            to: this.config.remotePeerId,
        });

        // Send success response (optimistic)
        // In production, wait for remote ACK
        const response = Buffer.alloc(10);
        response[0] = SOCKS_VERSION;
        response[1] = SOCKS_REP_SUCCESS;
        response[2] = 0x00; // Reserved
        response[3] = SOCKS_ATYP_IPV4;
        // Bound address (0.0.0.0:0)
        response.writeUInt32BE(0, 4);
        response.writeUInt16BE(0, 8);

        conn.clientSocket.write(response);
        conn.state = 'connected';
    }

    /**
     * Forward data to remote peer
     */
    private forwardToRemote(conn: ProxyConnection, data: Buffer): void {
        if (!this.relaySend || !this.config) return;

        this.relaySend({
            type: 'WAKIL_DATA',
            connectionId: conn.id,
            data: data.toString('base64'),
            to: this.config.remotePeerId,
        });

        this.stats.bytesOut += data.length;
    }

    /**
     * اِسْتَقْبِل (Istaqbil) - Handle incoming data from remote peer
     */
    handleRemoteMessage(message: any): void {
        switch (message.type) {
            case 'WAKIL_DATA_RESPONSE':
                const conn = this.connections.get(message.connectionId);
                if (conn?.clientSocket) {
                    const data = Buffer.from(message.data, 'base64');
                    conn.clientSocket.write(data);
                    this.stats.bytesIn += data.length;
                }
                break;

            case 'WAKIL_DISCONNECT':
                this.closeConnection(message.connectionId);
                break;

            case 'WAKIL_ERROR':
                console.error(`[وَكِيل] Remote error: ${message.error}`);
                this.closeConnection(message.connectionId);
                break;
        }
    }

    /**
     * Send SOCKS error response
     */
    private sendError(conn: ProxyConnection, code: number): void {
        const response = Buffer.alloc(10);
        response[0] = SOCKS_VERSION;
        response[1] = code;
        conn.clientSocket.write(response);
        this.closeConnection(conn.id);
    }

    /**
     * Close connection
     */
    private closeConnection(connId: string): void {
        const conn = this.connections.get(connId);
        if (conn) {
            conn.state = 'closed';
            conn.clientSocket?.destroy();
            this.connections.delete(connId);
            this.stats.activeConnections--;

            // Notify remote
            if (this.relaySend && this.config) {
                this.relaySend({
                    type: 'WAKIL_DISCONNECT',
                    connectionId: connId,
                    to: this.config.remotePeerId,
                });
            }
        }
    }

    /**
     * أَوْقِف (Awqif) - Stop the proxy
     * From Lisan: "أَوْقَفَ - to stop"
     */
    stop(): void {
        console.log('[وَكِيل] Stopping proxy');

        // Close all connections
        for (const connId of this.connections.keys()) {
            this.closeConnection(connId);
        }

        // Close server
        if (this.server) {
            this.server.close();
            this.server = null;
        }

        this.state = 'mutawwaqif';
        this.onStateChange?.(this.state);
        this.emit('stateChange', this.state);
    }

    /**
     * Get proxy stats
     */
    getStats(): WakilStats {
        return {
            ...this.stats,
            uptime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
        };
    }

    /**
     * Get current state
     */
    getState(): WakilState {
        return this.state;
    }

    /**
     * Check if running
     */
    isRunning(): boolean {
        return this.state === 'yashtaghil';
    }

    // Event handlers
    setOnStateChange(handler: StateCallback): void {
        this.onStateChange = handler;
    }

    setOnNewConnection(handler: ConnectionCallback): void {
        this.onNewConnection = handler;
    }
}

// Singleton export
export const wakilProxy = new WakilProxy();
export default WakilProxy;
