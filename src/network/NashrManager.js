/**
 * نَشْر و اتِّبَاع (Nashr & Ittiba') - Follower-Hosted Distributed Social Feed
 * 
 * Philosophy:
 * - Posts are NOT hosted on servers.
 * - Posts are replicated exclusively onto followers' devices (Hafiz / حَافِظ).
 * - Anyone can query an author's feed from any active follower if author is offline.
 * - Every post is cryptographically signed with author's Ed25519 key.
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const ed = require('@noble/ed25519');

class NashrManager extends EventEmitter {
    constructor(nodeClient) {
        super();
        this.client = nodeClient;

        // My own published posts: postId -> Post
        this.myPosts = new Map();

        // Followers & Following
        this.followers = new Set(); // peerIds following me
        this.following = new Set(); // peerIds I am following

        // Cached feeds from authors I follow or host: authorId -> Map(postId -> Post)
        this.feedCache = new Map();
    }

    /**
     * Follow an author
     */
    async follow(authorId) {
        this.following.add(authorId);
        if (!this.feedCache.has(authorId)) {
            this.feedCache.set(authorId, new Map());
        }

        // Send follow request
        const followPacket = {
            type: 'NASHR_FOLLOW',
            followerId: this.client.identity.fullId,
            authorId,
            timestamp: Date.now()
        };

        if (this.client.peers.has(authorId)) {
            await this.client.sendMessage(authorId, JSON.stringify(followPacket));
        }

        this.emit('followed_author', { authorId });
        return { success: true, authorId };
    }

    /**
     * Publish a new signed post
     */
    async publishPost(content) {
        const timestamp = Date.now();
        const postId = 'post_' + crypto.randomBytes(8).toString('hex');
        
        // Sign: authorId + timestamp + content
        const msgBytes = new TextEncoder().encode(`${this.client.identity.fullId}:${timestamp}:${content}`);
        const sigBytes = await ed.signAsync(msgBytes, this.client.identity.privateKey);
        const signatureHex = Buffer.from(sigBytes).toString('hex');

        const post = {
            id: postId,
            authorId: this.client.identity.fullId,
            authorPrefix: this.client.identity.prefix,
            publicKeyHex: Buffer.from(this.client.identity.publicKey).toString('hex'),
            content,
            timestamp,
            signature: signatureHex
        };

        this.myPosts.set(postId, post);

        // Store in own feed cache
        if (!this.feedCache.has(this.client.identity.fullId)) {
            this.feedCache.set(this.client.identity.fullId, new Map());
        }
        this.feedCache.get(this.client.identity.fullId).set(postId, post);

        // Replicate to all followers
        const replicationPacket = {
            type: 'NASHR_POST',
            post
        };
        const payloadStr = JSON.stringify(replicationPacket);

        const replicatedTo = [];
        for (const followerId of this.followers) {
            if (this.client.peers.has(followerId)) {
                try {
                    await this.client.sendMessage(followerId, payloadStr);
                    replicatedTo.push(followerId);
                } catch (e) {}
            }
        }

        // Also push to all currently connected peers for immediate propagation
        for (const peerId of this.client.peers.keys()) {
            if (!this.followers.has(peerId)) {
                try {
                    await this.client.sendMessage(peerId, payloadStr);
                } catch (e) {}
            }
        }

        this.emit('post_published', { post, replicatedTo });
        return post;
    }

    /**
     * Query / Fetch feed for an author (can be answered by author OR any follower hosting it)
     */
    async queryFeed(authorId) {
        const queryPacket = {
            type: 'NASHR_QUERY',
            requesterId: this.client.identity.fullId,
            authorId,
            timestamp: Date.now()
        };
        const payloadStr = JSON.stringify(queryPacket);

        // Broadcast query to all connected peers
        for (const peerId of this.client.peers.keys()) {
            try {
                await this.client.sendMessage(peerId, payloadStr);
            } catch (e) {}
        }
    }

    /**
     * Handle incoming Nashr packet
     */
    async handleIncomingNashrPacket(rawContent, fromPeerId) {
        let packet;
        try {
            packet = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        } catch (e) {
            return false;
        }

        switch (packet.type) {
            case 'NASHR_FOLLOW': {
                this.followers.add(packet.followerId);
                this.emit('new_follower', { followerId: packet.followerId });

                // Send back our recent posts to the new follower
                const recentPosts = Array.from(this.myPosts.values()).slice(-10);
                if (recentPosts.length > 0 && this.client.peers.has(packet.followerId)) {
                    await this.client.sendMessage(packet.followerId, JSON.stringify({
                        type: 'NASHR_FEED_REPLY',
                        authorId: this.client.identity.fullId,
                        posts: recentPosts,
                        seededBy: this.client.identity.fullId
                    }));
                }
                return true;
            }

            case 'NASHR_POST': {
                const post = packet.post;
                if (!post || !post.authorId || !post.signature) return false;

                // Verify Ed25519 signature
                const valid = await this.verifyPostSignature(post);
                if (!valid) {
                    this.emit('error', new Error(`Invalid signature on post ${post.id} from ${post.authorId}`));
                    return false;
                }

                // Cache post locally (Hafiz role)
                if (!this.feedCache.has(post.authorId)) {
                    this.feedCache.set(post.authorId, new Map());
                }
                this.feedCache.get(post.authorId).set(post.id, post);

                this.emit('feed_post_received', { post, fromPeer: fromPeerId });
                return true;
            }

            case 'NASHR_QUERY': {
                const targetAuthor = packet.authorId;
                let postsToSend = [];

                if (targetAuthor === this.client.identity.fullId) {
                    postsToSend = Array.from(this.myPosts.values());
                } else if (this.feedCache.has(targetAuthor)) {
                    postsToSend = Array.from(this.feedCache.get(targetAuthor).values());
                }

                if (postsToSend.length > 0 && this.client.peers.has(packet.requesterId)) {
                    await this.client.sendMessage(packet.requesterId, JSON.stringify({
                        type: 'NASHR_FEED_REPLY',
                        authorId: targetAuthor,
                        posts: postsToSend,
                        seededBy: this.client.identity.fullId
                    }));
                }
                return true;
            }

            case 'NASHR_FEED_REPLY': {
                const posts = packet.posts || [];
                const verifiedPosts = [];

                for (const post of posts) {
                    const valid = await this.verifyPostSignature(post);
                    if (valid) {
                        if (!this.feedCache.has(post.authorId)) {
                            this.feedCache.set(post.authorId, new Map());
                        }
                        this.feedCache.get(post.authorId).set(post.id, post);
                        verifiedPosts.push(post);
                    }
                }

                this.emit('feed_received', {
                    authorId: packet.authorId,
                    posts: verifiedPosts,
                    seededBy: packet.seededBy
                });
                return true;
            }
        }

        return false;
    }

    /**
     * Cryptographically verify post signature
     */
    async verifyPostSignature(post) {
        try {
            const pubKey = Buffer.from(post.publicKeyHex, 'hex');
            const msgBytes = new TextEncoder().encode(`${post.authorId}:${post.timestamp}:${post.content}`);
            const sigBytes = Buffer.from(post.signature, 'hex');
            return await ed.verifyAsync(sigBytes, msgBytes, pubKey);
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all cached posts for timeline
     */
    getTimeline(authorId = null) {
        if (authorId) {
            const authorMap = this.feedCache.get(authorId);
            return authorMap ? Array.from(authorMap.values()).sort((a, b) => b.timestamp - a.timestamp) : [];
        }

        const all = [];
        for (const authorMap of this.feedCache.values()) {
            all.push(...authorMap.values());
        }
        return all.sort((a, b) => b.timestamp - a.timestamp);
    }
}

module.exports = NashrManager;
