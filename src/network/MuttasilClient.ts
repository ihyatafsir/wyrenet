/**
 * مُتَّصِل (Muttasil) - TCP Relay Client
 * From Lisan al-Arab: "المُتَّصِل - The one who connects/joins"
 * 
 * Connects to a peer's embedded Mudtadeef relay server.
 * Enhanced with إِعَادَة الوَصْل (auto-reconnection) and نَبْض (heartbeat).
 */

import TcpSocket from 'react-native-tcp-socket';

interface RelayMessage {
    type: 'ID' | 'MSG' | 'PEERS' | 'JOIN' | 'LEAVE';
    id?: string;
    content?: string;
    encrypted?: boolean;
    from?: string;
    peers?: string[];
}

/**
 * حَالَة الوَصْل (Halat al-Wasl) - Connection State
 * From Lisan: "حَال - state, condition"
 */
export type ConnectionState = 'munfasil' | 'yattasil' | 'muttasil' | 'muqta';
// مُنْفَصِل (disconnected) | يَتَّصِل (connecting) | مُتَّصِل (connected) | مُقْطَع (error)

class MuttasilClient {
    private socket: any = null;
    private state: ConnectionState = 'munfasil';
    private myId: string = '';
    private myPublicKey: string = '';
    private buffer: string = '';

    // إِعَادَة الوَصْل (I'adat al-Wasl) - Auto-reconnection
    private autoReconnect = true;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000]; // تَأَخُّر مُضَاعَف
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private lastHost: string = '';
    private lastPort: number = 0;

    // نَبْض (Nabd) - Heartbeat
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private lastHeartbeat: number = 0;
    private heartbeatMs = 25000;

    private onConnected?: () => void;
    private onDisconnected?: () => void;
    private onMessage?: (from: string, content: string, encrypted: boolean) => void;
    private onPeersUpdate?: (peers: string[]) => void;
    private onPeerJoin?: (peerId: string) => void;
    private onPeerLeave?: (peerId: string) => void;
    private onStateChange?: (state: ConnectionState) => void;

    constructor() {
        console.log('[مُتَّصِل] Muttasil client initialized - إِعَادَة الوَصْل enabled');
    }

    private setState(newState: ConnectionState): void {
        if (this.state !== newState) {
            console.log(`[مُتَّصِل] State: ${this.state} → ${newState}`);
            this.state = newState;
            this.onStateChange?.(newState);
        }
    }

    /**
     * اِتِّصَال (Ittisal) - Connect to peer relay
     */
    async connect(host: string, port: number, myId: string, myPublicKey: string): Promise<void> {
        if (this.state === 'muttasil') {
            console.log('[مُتَّصِل] Already connected');
            return;
        }

        this.myId = myId;
        this.myPublicKey = myPublicKey;
        this.lastHost = host;
        this.lastPort = port;
        this.setState('yattasil');

        return new Promise((resolve, reject) => {
            this.socket = TcpSocket.createConnection(
                { host, port },
                () => {
                    console.log(`[مُتَّصِل] Connected to ${host}:${port}`);
                    this.setState('muttasil');
                    this.reconnectAttempts = 0;

                    this.send({ type: 'ID', id: myId, content: myPublicKey });
                    this.startHeartbeat();
                    this.onConnected?.();
                    resolve();
                }
            );

            this.socket.on('data', (data: Buffer) => {
                this.lastHeartbeat = Date.now();
                this.handleData(data);
            });

            this.socket.on('close', () => {
                console.log('[مُتَّصِل] Connection closed');
                this.stopHeartbeat();
                this.setState('munfasil');
                this.onDisconnected?.();

                if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            });

            this.socket.on('error', (error: Error) => {
                console.error('[مُتَّصِل] Connection error:', error.message);
                this.stopHeartbeat();
                this.setState('muqta');

                if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                } else {
                    reject(error);
                }
            });

            setTimeout(() => {
                if (this.state === 'yattasil') {
                    this.socket?.destroy();
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * إِعَادَة الوَصْل (I'adat al-Wasl) - Schedule reconnection
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        const delay = this.reconnectDelays[
            Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)
        ];
        this.reconnectAttempts++;

        console.log(`[مُتَّصِل] إِعَادَة الوَصْل in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            try {
                await this.connect(this.lastHost, this.lastPort, this.myId, this.myPublicKey);
            } catch (e) {
                console.error('[مُتَّصِل] Reconnect failed:', e);
            }
        }, delay);
    }

    /**
     * نَبْض (Nabd) - Start heartbeat
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.lastHeartbeat = Date.now();

        this.heartbeatInterval = setInterval(() => {
            const elapsed = Date.now() - this.lastHeartbeat;
            if (elapsed > this.heartbeatMs * 2) {
                console.warn('[مُتَّصِل] نَبْض lost - reconnecting');
                this.socket?.destroy();
            }
        }, this.heartbeatMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * قَطْع (Disconnect)
     */
    disconnect(): void {
        this.autoReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.setState('munfasil');
            console.log('[مُتَّصِل] Disconnected');
        }
    }

    private handleData(data: Buffer): void {
        this.buffer += data.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    const msg: RelayMessage = JSON.parse(line);
                    this.handleMessage(msg);
                } catch (e) {
                    console.error('[مُتَّصِل] Parse error:', e);
                }
            }
        }
    }

    private handleMessage(msg: RelayMessage): void {
        switch (msg.type) {
            case 'MSG':
                if (msg.from && msg.content) {
                    this.onMessage?.(msg.from, msg.content, msg.encrypted || false);
                }
                break;
            case 'PEERS':
                if (msg.peers) this.onPeersUpdate?.(msg.peers);
                break;
            case 'JOIN':
                if (msg.id) this.onPeerJoin?.(msg.id);
                break;
            case 'LEAVE':
                if (msg.id) this.onPeerLeave?.(msg.id);
                break;
        }
    }

    /**
     * إِرْسَال رِسَالَة (Send message)
     */
    sendMessage(content: string, encrypted: boolean = false): boolean {
        if (this.state !== 'muttasil') {
            console.warn('[مُتَّصِل] Not connected');
            return false;
        }
        return this.send({ type: 'MSG', content, encrypted });
    }

    private send(msg: RelayMessage): boolean {
        if (!this.socket || this.state !== 'muttasil') return false;
        try {
            this.socket.write(JSON.stringify(msg) + '\n');
            return true;
        } catch (e) {
            console.error('[مُتَّصِل] Send error:', e);
            return false;
        }
    }

    // Event handlers
    setOnConnected(handler: () => void): void { this.onConnected = handler; }
    setOnDisconnected(handler: () => void): void { this.onDisconnected = handler; }
    setOnMessage(handler: (from: string, content: string, encrypted: boolean) => void): void { this.onMessage = handler; }
    setOnPeersUpdate(handler: (peers: string[]) => void): void { this.onPeersUpdate = handler; }
    setOnPeerJoin(handler: (peerId: string) => void): void { this.onPeerJoin = handler; }
    setOnPeerLeave(handler: (peerId: string) => void): void { this.onPeerLeave = handler; }
    setOnStateChange(handler: (state: ConnectionState) => void): void { this.onStateChange = handler; }

    // Getters
    getIsConnected(): boolean { return this.state === 'muttasil'; }
    getState(): ConnectionState { return this.state; }

    // Configuration
    setAutoReconnect(enabled: boolean): void { this.autoReconnect = enabled; }
}

export const muttasilClient = new MuttasilClient();
export default MuttasilClient;
