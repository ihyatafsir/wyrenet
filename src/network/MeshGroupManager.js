/**
 * جَمَاعَة و إِشَاعَة (Jama'ah & Ishaa'ah) - Mesh Gossip Group Chat Manager
 * 
 * Features:
 * - Multi-peer group creation and membership
 * - Multi-hop mesh gossip routing (Flooding with loop prevention)
 * - TTL (Time-To-Live) and visited hops tracking
 * - LRU message deduplication
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class MeshGroupManager extends EventEmitter {
    constructor(nodeClient, options = {}) {
        super();
        this.client = nodeClient;
        this.defaultTtl = options.defaultTtl || 4; // Max 4 hops
        
        // Groups: groupId -> { id, name, members: Set<string>, createdAt }
        this.groups = new Map();
        
        // LRU Cache for message deduplication: messageId -> timestamp
        this.seenMessages = new Map();
        this.maxSeenCache = 1000;
    }

    /**
     * Create a new group
     */
    createGroup(groupName) {
        const groupId = 'group_' + crypto.randomBytes(6).toString('hex');
        const group = {
            id: groupId,
            name: groupName,
            creator: this.client.identity.fullId,
            members: new Set([this.client.identity.fullId]),
            createdAt: Date.now()
        };

        this.groups.set(groupId, group);
        this.emit('group_created', group);
        return group;
    }

    /**
     * Join or register an existing group
     */
    joinGroup(groupId, groupName = 'Unnamed Group') {
        let group = this.groups.get(groupId);
        if (!group) {
            group = {
                id: groupId,
                name: groupName,
                creator: 'unknown',
                members: new Set(),
                createdAt: Date.now()
            };
            this.groups.set(groupId, group);
        }

        group.members.add(this.client.identity.fullId);
        this.emit('group_joined', group);
        return group;
    }

    /**
     * Broadcast a message to a group across the mesh
     */
    async sendGroupMessage(groupId, content) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found. Join or create it first.`);
        }

        const messageId = 'gmsg_' + crypto.randomBytes(8).toString('hex');
        this.markSeen(messageId);

        const groupPacket = {
            type: 'GROUP_MSG',
            groupId,
            groupName: group.name,
            messageId,
            senderId: this.client.identity.fullId,
            content,
            timestamp: Date.now(),
            ttl: this.defaultTtl,
            visitedPeers: [this.client.identity.fullId]
        };

        // Forward to all directly connected peers
        const forwardedTo = [];
        for (const [peerId, peer] of this.client.peers.entries()) {
            try {
                await this.client.sendMessage(peerId, JSON.stringify(groupPacket));
                forwardedTo.push(peerId);
            } catch (e) {}
        }

        return { messageId, groupId, forwardedTo };
    }

    /**
     * Handle incoming group packet (process locally + forward to neighbors)
     */
    async handleIncomingGroupPacket(rawContent, fromPeerId) {
        let packet;
        try {
            packet = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        } catch (e) {
            return false;
        }

        if (packet.type !== 'GROUP_MSG' || !packet.messageId) {
            return false;
        }

        // Deduplication: Drop if already processed
        if (this.seenMessages.has(packet.messageId)) {
            return false;
        }
        this.markSeen(packet.messageId);

        // Auto-register group if not known
        if (!this.groups.has(packet.groupId)) {
            this.joinGroup(packet.groupId, packet.groupName || 'Mesh Group');
        }

        const group = this.groups.get(packet.groupId);
        group.members.add(packet.senderId);

        // Emit local group message event
        this.emit('group_message', {
            groupId: packet.groupId,
            groupName: packet.groupName,
            messageId: packet.messageId,
            senderId: packet.senderId,
            content: packet.content,
            timestamp: packet.timestamp,
            viaPeer: fromPeerId,
            hops: packet.visitedPeers?.length || 1
        });

        // Multi-hop Gossip Forwarding (إِشَاعَة)
        if (packet.ttl > 1) {
            const nextPacket = {
                ...packet,
                ttl: packet.ttl - 1,
                visitedPeers: [...(packet.visitedPeers || []), this.client.identity.fullId]
            };
            const nextPayload = JSON.stringify(nextPacket);

            // Forward to all connected peers EXCEPT sender and previously visited nodes
            const visitedSet = new Set(nextPacket.visitedPeers);
            visitedSet.add(fromPeerId);

            for (const [peerId, peer] of this.client.peers.entries()) {
                if (!visitedSet.has(peerId)) {
                    try {
                        await this.client.sendMessage(peerId, nextPayload);
                    } catch (e) {}
                }
            }
        }

        return true;
    }

    /**
     * Mark message as seen with LRU trimming
     */
    markSeen(messageId) {
        if (this.seenMessages.size >= this.maxSeenCache) {
            const oldestKey = this.seenMessages.keys().next().value;
            this.seenMessages.delete(oldestKey);
        }
        this.seenMessages.set(messageId, Date.now());
    }
}

module.exports = MeshGroupManager;
