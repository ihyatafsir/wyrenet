/**
 * WyreSup Node.js P2P Core Client (مُتَّصِل / مُضْتَضِيف)
 * Production-ready Node.js P2P communication client
 * 
 * Implements:
 * - Ed25519 Identity (هُوِيَّة)
 * - Puncturable forward-secret encryption (مِفْتَاح / عَقْد)
 * - Dual-layer packet protocol (ظَاهِر و بَاطِن - ZBAT)
 * - Direct TCP peer-to-peer transport with length-prefixed framing
 * - WebSocket Relay fallback transport (وَسِيط)
 * - Encrypted File Transfer (نَقْل المَلَفَّات) with TAKHIR chunking
 * - Mesh Gossip Group Chat (جَمَاعَة و إِشَاعَة) with multi-hop routing
 * - Follower-Hosted Distributed Social Feed (نَشْر و اتِّبَاع)
 * - Real-time Voice Note Streaming (صَوْت) with ISTI_JAL priority
 */

const net = require('net');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ed = require('@noble/ed25519');
const { sha512: jsSha512 } = require('js-sha512');

// Configure noble/ed25519
ed.hashes.sha512 = (data) => {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return new Uint8Array(hash.digest());
};

const { MiftahEngine } = require('./src/network/MiftahEncryption.js');
const FileTransferManager = require('./src/network/FileTransferManager.js');
const MeshGroupManager = require('./src/network/MeshGroupManager.js');
const NashrManager = require('./src/network/NashrManager.js');
const SawtManager = require('./src/network/SawtManager.js');

class NodeP2PClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.name = options.name || 'node_' + Math.random().toString(36).substring(2, 7);
        this.tcpPort = options.tcpPort || null;
        this.relayUrl = options.relayUrl || null;
        this.storagePath = options.storagePath || null;
        
        // Identity
        this.identity = null;
        this.miftah = new MiftahEngine();
        
        // Network state
        this.tcpServer = null;
        this.wsRelay = null;
        this.relayConnected = false;
        
        // Peers: peerId -> { id, publicKey, transport: 'tcp'|'relay', tcpSocket, address, port, keyEstablished, lastSeen }
        this.peers = new Map();
        
        // Subsystem Managers
        this.fileTransfer = new FileTransferManager(options.fileOptions || {});
        this.meshGroup = new MeshGroupManager(this, options.groupOptions || {});
        this.nashr = new NashrManager(this);
        this.sawt = new SawtManager(this);

        this.bindSubsystemEvents();
    }

    /**
     * Bind subsystem events to bubble up
     */
    bindSubsystemEvents() {
        this.fileTransfer.on('file_received', (ev) => this.emit('file_received', ev));
        this.fileTransfer.on('transfer_progress', (ev) => this.emit('transfer_progress', ev));
        this.fileTransfer.on('file_offer', (ev) => this.emit('file_offer', ev));
        
        this.meshGroup.on('group_message', (ev) => this.emit('group_message', ev));
        this.meshGroup.on('group_created', (ev) => this.emit('group_created', ev));
        
        this.nashr.on('feed_post_received', (ev) => this.emit('feed_post_received', ev));
        this.nashr.on('feed_received', (ev) => this.emit('feed_received', ev));
        this.nashr.on('new_follower', (ev) => this.emit('new_follower', ev));
        
        this.sawt.on('voice_received', (ev) => this.emit('voice_received', ev));
        this.sawt.on('voice_sent', (ev) => this.emit('voice_sent', ev));
    }

    /**
     * Initialize identity and network listeners
     */
    async init() {
        await this.initIdentity();
        
        if (this.tcpPort) {
            await this.startTcpServer(this.tcpPort);
        }
        
        if (this.relayUrl) {
            this.connectRelay(this.relayUrl);
        }
        
        this.emit('ready', {
            identity: this.identity,
            tcpPort: this.tcpPort,
            relayUrl: this.relayUrl
        });
        
        return this;
    }

    /**
     * Initialize or load Ed25519 identity
     */
    async initIdentity() {
        if (this.storagePath && fs.existsSync(this.storagePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
                this.identity = {
                    prefix: data.prefix,
                    privateKey: new Uint8Array(data.privateKey),
                    publicKey: new Uint8Array(data.publicKey),
                    hash: data.hash,
                    fullId: data.fullId
                };
                return this.identity;
            } catch (e) {}
        }

        const privateKey = ed.utils.randomSecretKey();
        const publicKey = await ed.getPublicKey(privateKey);
        const hash = Array.from(publicKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
        const fullId = `${this.name}@${hash}`;

        this.identity = {
            prefix: this.name,
            privateKey,
            publicKey,
            hash,
            fullId
        };

        if (this.storagePath) {
            fs.writeFileSync(this.storagePath, JSON.stringify({
                prefix: this.identity.prefix,
                privateKey: Array.from(this.identity.privateKey),
                publicKey: Array.from(this.identity.publicKey),
                hash: this.identity.hash,
                fullId: this.identity.fullId
            }, null, 2), 'utf8');
        }

        return this.identity;
    }

    /**
     * Start direct TCP Server
     */
    startTcpServer(port) {
        return new Promise((resolve, reject) => {
            this.tcpServer = net.createServer((socket) => {
                this.handleIncomingTcpSocket(socket);
            });

            this.tcpServer.on('error', (err) => {
                this.emit('error', new Error(`TCP Server Error: ${err.message}`));
                reject(err);
            });

            this.tcpServer.listen(port, '0.0.0.0', () => {
                this.tcpPort = this.tcpServer.address().port;
                this.emit('tcp_listening', { port: this.tcpPort });
                resolve(this.tcpPort);
            });
        });
    }

    /**
     * Connect directly to a peer via TCP
     */
    connectTcp(host, port) {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection({ host, port }, () => {
                this.setupTcpSocket(socket, `${host}:${port}`);
                this.sendKeyOffer(socket, 'tcp');
                resolve(socket);
            });

            socket.on('error', (err) => {
                this.emit('error', new Error(`TCP Connection to ${host}:${port} failed: ${err.message}`));
                reject(err);
            });
        });
    }

    handleIncomingTcpSocket(socket) {
        const remoteKey = `${socket.remoteAddress}:${socket.remotePort}`;
        this.setupTcpSocket(socket, remoteKey);
    }

    setupTcpSocket(socket, key) {
        let buffer = Buffer.alloc(0);

        socket.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);

            while (buffer.length >= 4) {
                const msgLength = buffer.readUInt32BE(0);
                if (buffer.length < 4 + msgLength) {
                    break;
                }

                const frame = buffer.subarray(4, 4 + msgLength);
                buffer = buffer.subarray(4 + msgLength);

                try {
                    const packet = JSON.parse(frame.toString('utf8'));
                    this.handlePacket(packet, socket, 'tcp');
                } catch (err) {
                    this.emit('error', new Error(`Corrupted TCP frame: ${err.message}`));
                }
            }
        });

        socket.on('close', () => {
            for (const [peerId, peer] of this.peers.entries()) {
                if (peer.tcpSocket === socket) {
                    this.peers.delete(peerId);
                    this.emit('peer_disconnected', { peerId, transport: 'tcp' });
                }
            }
        });

        socket.on('error', (err) => {
            this.emit('error', new Error(`Socket error (${key}): ${err.message}`));
        });
    }

    connectRelay(url) {
        this.relayUrl = url;
        this.wsRelay = new WebSocket(url);

        this.wsRelay.on('open', () => {
            this.relayConnected = true;
            this.wsRelay.send(JSON.stringify({
                type: 'REGISTER',
                identity: this.identity.fullId,
                publicKey: Buffer.from(this.identity.publicKey).toString('hex')
            }));
            this.emit('relay_connected', { url });
        });

        this.wsRelay.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleRelayMessage(msg);
            } catch (err) {
                this.emit('error', new Error(`Relay message parse error: ${err.message}`));
            }
        });

        this.wsRelay.on('close', () => {
            this.relayConnected = false;
            this.emit('relay_disconnected', { url });
        });

        this.wsRelay.on('error', (err) => {
            this.emit('error', new Error(`Relay error: ${err.message}`));
        });
    }

    handleRelayMessage(msg) {
        switch (msg.type) {
            case 'REGISTERED':
                this.emit('relay_registered', msg);
                if (msg.peers && msg.peers.length > 0) {
                    for (const peerId of msg.peers) {
                        this.initiateRelayHandshake(peerId);
                    }
                }
                break;

            case 'PEER_JOINED':
                this.emit('peer_discovered', { peerId: msg.peerId, transport: 'relay' });
                this.initiateRelayHandshake(msg.peerId);
                break;

            case 'PEER_LEFT':
                this.peers.delete(msg.peerId);
                this.emit('peer_disconnected', { peerId: msg.peerId, transport: 'relay' });
                break;

            case 'KEY_OFFER':
            case 'KEY_ACCEPT':
            case 'KEY_CONFIRM':
            case 'MSG':
                this.handlePacket(msg, null, 'relay');
                break;
        }
    }

    initiateRelayHandshake(peerId) {
        if (!this.relayConnected || !this.wsRelay) return;
        const nonce = crypto.randomBytes(16).toString('hex');
        this.wsRelay.send(JSON.stringify({
            type: 'KEY_OFFER',
            to: peerId,
            from: this.identity.fullId,
            publicKey: Buffer.from(this.identity.publicKey).toString('hex'),
            nonce,
            timestamp: Date.now()
        }));
    }

    sendKeyOffer(target, transport = 'tcp') {
        const nonce = crypto.randomBytes(16).toString('hex');
        const offer = {
            type: 'KEY_OFFER',
            from: this.identity.fullId,
            publicKey: Buffer.from(this.identity.publicKey).toString('hex'),
            nonce,
            timestamp: Date.now()
        };

        if (transport === 'tcp' && target) {
            this.sendTcpFrame(target, offer);
        }
    }

    async handlePacket(packet, socket, transport) {
        const from = packet.from;
        if (!from || from === this.identity.fullId) return;

        switch (packet.type) {
            case 'KEY_OFFER': {
                const peerPublicKey = Buffer.from(packet.publicKey, 'hex');
                await this.miftah.aqd(from, this.identity.privateKey, peerPublicKey);
                
                this.peers.set(from, {
                    id: from,
                    publicKey: peerPublicKey,
                    transport,
                    tcpSocket: socket || null,
                    keyEstablished: true,
                    lastSeen: Date.now()
                });

                const acceptNonce = crypto.randomBytes(16).toString('hex');
                const reply = {
                    type: 'KEY_ACCEPT',
                    to: from,
                    from: this.identity.fullId,
                    publicKey: Buffer.from(this.identity.publicKey).toString('hex'),
                    nonce: acceptNonce,
                    timestamp: Date.now()
                };

                if (transport === 'tcp' && socket) {
                    this.sendTcpFrame(socket, reply);
                } else if (transport === 'relay' && this.wsRelay) {
                    this.wsRelay.send(JSON.stringify(reply));
                }

                this.emit('key_established', { peerId: from, transport });
                break;
            }

            case 'KEY_ACCEPT': {
                const peerPublicKey = Buffer.from(packet.publicKey, 'hex');
                await this.miftah.aqd(from, this.identity.privateKey, peerPublicKey);

                this.peers.set(from, {
                    id: from,
                    publicKey: peerPublicKey,
                    transport,
                    tcpSocket: socket || null,
                    keyEstablished: true,
                    lastSeen: Date.now()
                });

                const confirm = {
                    type: 'KEY_CONFIRM',
                    to: from,
                    from: this.identity.fullId,
                    timestamp: Date.now()
                };

                if (transport === 'tcp' && socket) {
                    this.sendTcpFrame(socket, confirm);
                } else if (transport === 'relay' && this.wsRelay) {
                    this.wsRelay.send(JSON.stringify(confirm));
                }

                this.emit('key_established', { peerId: from, transport });
                break;
            }

            case 'KEY_CONFIRM': {
                const peer = this.peers.get(from);
                if (peer) {
                    peer.keyEstablished = true;
                    peer.lastSeen = Date.now();
                }
                this.emit('peer_connected', { peerId: from, transport });
                break;
            }

            case 'MSG': {
                if (!this.peers.has(from)) {
                    this.peers.set(from, {
                        id: from,
                        transport,
                        tcpSocket: socket || null,
                        keyEstablished: false,
                        lastSeen: Date.now()
                    });
                    this.emit('peer_discovered', { peerId: from, transport });
                }
                const peer = this.peers.get(from);
                if (peer) peer.lastSeen = Date.now();

                if (packet.encrypted && packet.zbat) {
                    try {
                        const zahir = packet.zbat.zahir;
                        const ciphertext = packet.zbat.ciphertext;
                        
                        const decrypted = await this.miftah.fakk(from, ciphertext);
                        if (decrypted !== null) {
                                                        if (await this.dispatchSubsystems(decrypted, from, transport, zahir?.daraja)) {
                                return;
                            }

                            this.emit('message', {
                                from,
                                to: this.identity.fullId,
                                text: decrypted,
                                daraja: zahir?.daraja || 2,
                                sequence: packet.zbat.sequence,
                                encrypted: true,
                                transport,
                                timestamp: packet.timestamp || Date.now()
                            });
                        } else {
                            this.emit('security_warning', {
                                type: 'REPLAY_OR_CORRUPT',
                                from,
                                detail: 'Failed to decrypt or sequence already punctured (Thaqb).'
                            });
                        }
                    } catch (e) {
                        this.emit('error', new Error(`Decryption error: ${e.message}`));
                    }
                } else {
                    if (await this.dispatchSubsystems(packet.content, from, transport, 2)) {
                        return;
                    }

                    this.emit('message', {
                        from,
                        to: this.identity.fullId,
                        text: packet.content || '',
                        encrypted: false,
                        transport,
                        timestamp: packet.timestamp || Date.now()
                    });
                }
                break;
            }
        }
    }

    /**
     * Dispatch decrypted text to subsystems if formatted as subsystem JSON
     */
    async dispatchSubsystems(content, from, transport, daraja) {
        if (!content || typeof content !== 'string' || !content.startsWith('{')) {
            return false;
        }

        try {
            const parsed = JSON.parse(content);
            
            // 1. Group Chat Gossip
            if (parsed.type === 'GROUP_MSG') {
                return await this.meshGroup.handleIncomingGroupPacket(parsed, from);
            }

            // 2. Nashr Social Feed
            if (parsed.type?.startsWith('NASHR_')) {
                return await this.nashr.handleIncomingNashrPacket(parsed, from);
            }

            // 3. Sawt Voice Note
            if (parsed.type === 'SAWT_NOTE') {
                return this.sawt.handleIncomingSawtPacket(parsed, from);
            }

            // 4. File Transfer Meta & Chunks
            if (parsed.type === 'FILE_META') {
                this.fileTransfer.handleIncomingMetadata(parsed.metadata, from);
                return true;
            }
            if (parsed.type === 'FILE_CHUNK') {
                this.fileTransfer.handleIncomingChunk(parsed.chunk, from);
                return true;
            }
        } catch (e) {}

        return false;
    }

    /**
     * Send an encrypted ZBAT message to a peer
     */
    async sendMessage(recipientId, text, daraja = 2) {
        const peer = this.peers.get(recipientId);

        let packetPayload;
        if (this.miftah.hasMiftah(recipientId)) {
            const encrypted = await this.miftah.tashfir(recipientId, text);
            if (!encrypted) {
                throw new Error(`Miftah encryption failed for ${recipientId}`);
            }

            packetPayload = {
                type: 'MSG',
                to: recipientId,
                from: this.identity.fullId,
                encrypted: true,
                content: text,
                zbat: {
                    zahir: {
                        version: 1,
                        senderId: this.identity.fullId,
                        recipientId,
                        daraja,
                        timestamp: Date.now()
                    },
                    sequence: encrypted.sequence,
                    ciphertext: encrypted.encrypted
                },
                timestamp: Date.now()
            };
        } else {
            packetPayload = {
                type: 'MSG',
                to: recipientId,
                from: this.identity.fullId,
                encrypted: false,
                content: text,
                timestamp: Date.now()
            };
        }

        if (peer.transport === 'tcp' && peer.tcpSocket) {
            this.sendTcpFrame(peer.tcpSocket, packetPayload);
        } else if (this.relayConnected && this.wsRelay) {
            this.wsRelay.send(JSON.stringify(packetPayload));
        } else {
            throw new Error(`No available transport to reach ${recipientId}`);
        }

        return packetPayload;
    }

    /**
     * Send an entire file using chunking and TAKHIR priority
     */
    async sendFile(recipientId, filePath) {
        const meta = this.fileTransfer.prepareFile(filePath);

        // Send metadata packet
        const metaPacket = {
            type: 'FILE_META',
            metadata: meta
        };
        await this.sendMessage(recipientId, JSON.stringify(metaPacket), 3); // Daraja 3 (TAKHIR)

        // Send each chunk sequentially
        for (let i = 0; i < meta.totalChunks; i++) {
            const chunk = this.fileTransfer.getChunk(meta.transferId, i);
            const chunkPacket = {
                type: 'FILE_CHUNK',
                chunk
            };
            await this.sendMessage(recipientId, JSON.stringify(chunkPacket), 3);
        }

        return meta;
    }

    /**
     * Group Chat API
     */
    createGroup(name) {
        return this.meshGroup.createGroup(name);
    }

    joinGroup(groupId, name) {
        return this.meshGroup.joinGroup(groupId, name);
    }

    async sendGroupMessage(groupId, content) {
        return await this.meshGroup.sendGroupMessage(groupId, content);
    }

    /**
     * Nashr Social Feed API
     */
    async publishPost(content) {
        return await this.nashr.publishPost(content);
    }

    async follow(authorId) {
        return await this.nashr.follow(authorId);
    }

    async queryFeed(authorId) {
        return await this.nashr.queryFeed(authorId);
    }

    getTimeline(authorId = null) {
        return this.nashr.getTimeline(authorId);
    }

    /**
     * Sawt Voice Note API
     */
    async sendVoiceNote(peerId, durationSec = 3, caption = '') {
        return await this.sawt.sendVoiceNote(peerId, durationSec, caption);
    }

    async broadcastMessage(text) {
        const results = [];
        for (const peerId of this.peers.keys()) {
            try {
                const res = await this.sendMessage(peerId, text);
                results.push({ peerId, success: true, res });
            } catch (err) {
                results.push({ peerId, success: false, error: err.message });
            }
        }
        return results;
    }

    sendTcpFrame(socket, obj) {
        const jsonBuf = Buffer.from(JSON.stringify(obj), 'utf8');
        const header = Buffer.alloc(4);
        header.writeUInt32BE(jsonBuf.length, 0);
        socket.write(Buffer.concat([header, jsonBuf]));
    }

    async close() {
        if (this.tcpServer) {
            this.tcpServer.close();
            this.tcpServer = null;
        }

        for (const peer of this.peers.values()) {
            if (peer.tcpSocket) {
                peer.tcpSocket.destroy();
            }
            this.miftah.aghlaqa(peer.id);
        }
        this.peers.clear();

        if (this.wsRelay) {
            this.wsRelay.close();
            this.wsRelay = null;
        }
    }
}

module.exports = NodeP2PClient;
