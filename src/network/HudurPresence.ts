/**
 * حُضُور (Hudur) - Peer Presence and Status Manager
 * From Lisan al-Arab: "حَضَرَ - to be present, to attend"
 * 
 * Tracks peer online status, typing indicators, and read receipts
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRESENCE_STORAGE_KEY = '@wyresup_presence_cache';
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const OFFLINE_THRESHOLD = 45000; // 45 seconds without heartbeat = offline

/**
 * حَالَة الحُضُور (Halat al-Hudur) - Presence State
 */
export type PresenceState = 'hadir' | 'ghaib' | 'mashghul' | 'sahir';
// حَاضِر (online) | غَائِب (offline) | مَشْغُول (busy) | سَاهِر (away)

export interface PeerPresence {
    peerId: string;
    state: PresenceState;
    lastSeen: number;
    isTyping: boolean;
    typingExpires?: number;
    customStatus?: string;
    // وَصْل (Wasl) - Connection info
    connectionType?: 'tcp' | 'ws' | 'ble';
    latency?: number;
}

export interface ReadReceipt {
    messageId: string;
    peerId: string;
    readAt: number;
}

type PresenceCallback = (peerId: string, presence: PeerPresence) => void;
type TypingCallback = (peerId: string, isTyping: boolean) => void;
type ReadCallback = (receipt: ReadReceipt) => void;

class HudurManager extends EventEmitter {
    private presenceMap: Map<string, PeerPresence> = new Map();
    private myId: string = '';
    private myState: PresenceState = 'hadir';
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private typingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    private onPresenceChange?: PresenceCallback;
    private onTyping?: TypingCallback;
    private onRead?: ReadCallback;

    // سِلْك (Silk) - Wire/connection for sending presence
    private sendPresenceFn?: (data: any) => void;

    constructor() {
        super();
        console.log('[حُضُور] Hudur presence manager initialized');
        this.loadFromStorage();
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with peer ID and send function
     */
    initialize(myId: string, sendFn: (data: any) => void): void {
        this.myId = myId;
        this.sendPresenceFn = sendFn;
        this.startHeartbeat();
    }

    /**
     * تَحْدِيث الحُضُور (Tahdith al-Hudur) - Update peer presence
     */
    updatePresence(peerId: string, update: Partial<PeerPresence>): void {
        const existing = this.presenceMap.get(peerId) || {
            peerId,
            state: 'ghaib' as PresenceState,
            lastSeen: 0,
            isTyping: false,
        };

        const updated: PeerPresence = {
            ...existing,
            ...update,
            lastSeen: update.lastSeen || Date.now(),
        };

        this.presenceMap.set(peerId, updated);
        this.onPresenceChange?.(peerId, updated);
        this.emit('presence', peerId, updated);
    }

    /**
     * إِرْسَال حُضُورِي (Irsal Huduri) - Broadcast my presence
     */
    broadcastMyPresence(): void {
        if (!this.sendPresenceFn) return;

        this.sendPresenceFn({
            type: 'HUDUR',
            peerId: this.myId,
            state: this.myState,
            timestamp: Date.now(),
        });
    }

    /**
     * يَكْتُب (Yaktub) - Start typing indicator
     * From Lisan: "كَتَبَ - to write"
     */
    startTyping(targetPeerId: string): void {
        if (!this.sendPresenceFn) return;

        this.sendPresenceFn({
            type: 'YAKTUB',
            from: this.myId,
            to: targetPeerId,
            isTyping: true,
        });
    }

    /**
     * Stop typing indicator
     */
    stopTyping(targetPeerId: string): void {
        if (!this.sendPresenceFn) return;

        this.sendPresenceFn({
            type: 'YAKTUB',
            from: this.myId,
            to: targetPeerId,
            isTyping: false,
        });
    }

    /**
     * تَسَلَّم (Tasallam) - Mark message as read
     * From Lisan: "سَلَّمَ - to hand over, receive"
     */
    markAsRead(messageId: string, senderId: string): void {
        if (!this.sendPresenceFn) return;

        const receipt: ReadReceipt = {
            messageId,
            peerId: this.myId,
            readAt: Date.now(),
        };

        this.sendPresenceFn({
            type: 'TASALLAM',
            ...receipt,
            to: senderId,
        });
    }

    /**
     * Handle incoming presence data
     */
    handleIncoming(data: any): void {
        switch (data.type) {
            case 'HUDUR':
                // Peer presence update
                this.updatePresence(data.peerId, {
                    state: data.state,
                    lastSeen: data.timestamp,
                });
                break;

            case 'YAKTUB':
                // Typing indicator
                if (data.to === this.myId) {
                    this.handleTypingIndicator(data.from, data.isTyping);
                }
                break;

            case 'TASALLAM':
                // Read receipt
                if (data.to === this.myId) {
                    const receipt: ReadReceipt = {
                        messageId: data.messageId,
                        peerId: data.peerId,
                        readAt: data.readAt,
                    };
                    this.onRead?.(receipt);
                    this.emit('read', receipt);
                }
                break;
        }
    }

    /**
     * Handle typing indicator with auto-expire
     */
    private handleTypingIndicator(peerId: string, isTyping: boolean): void {
        // Clear existing timer
        const existingTimer = this.typingTimers.get(peerId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Update presence
        const presence = this.presenceMap.get(peerId);
        if (presence) {
            presence.isTyping = isTyping;
            this.presenceMap.set(peerId, presence);
        }

        this.onTyping?.(peerId, isTyping);
        this.emit('typing', peerId, isTyping);

        // Auto-expire typing after 5 seconds
        if (isTyping) {
            const timer = setTimeout(() => {
                this.handleTypingIndicator(peerId, false);
            }, 5000);
            this.typingTimers.set(peerId, timer);
        }
    }

    /**
     * نَبْض الحُضُور (Nabd al-Hudur) - Presence heartbeat
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            // Broadcast my presence
            this.broadcastMyPresence();

            // Check for stale peers
            const now = Date.now();
            for (const [peerId, presence] of this.presenceMap) {
                if (presence.state !== 'ghaib' && now - presence.lastSeen > OFFLINE_THRESHOLD) {
                    this.updatePresence(peerId, { state: 'ghaib' });
                    console.log(`[حُضُور] Peer ${peerId} went offline (timeout)`);
                }
            }
        }, HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Set my presence state
     */
    setMyState(state: PresenceState): void {
        this.myState = state;
        this.broadcastMyPresence();
    }

    /**
     * Get peer presence
     */
    getPresence(peerId: string): PeerPresence | undefined {
        return this.presenceMap.get(peerId);
    }

    /**
     * Get all online peers
     */
    getOnlinePeers(): PeerPresence[] {
        return Array.from(this.presenceMap.values())
            .filter(p => p.state === 'hadir');
    }

    /**
     * Check if peer is typing
     */
    isTyping(peerId: string): boolean {
        return this.presenceMap.get(peerId)?.isTyping || false;
    }

    // Event handlers
    setOnPresenceChange(handler: PresenceCallback): void {
        this.onPresenceChange = handler;
    }

    setOnTyping(handler: TypingCallback): void {
        this.onTyping = handler;
    }

    setOnRead(handler: ReadCallback): void {
        this.onRead = handler;
    }

    /**
     * تَخْزِين (Takhzin) - Persist to storage
     */
    private async persistToStorage(): Promise<void> {
        try {
            const data = JSON.stringify(Array.from(this.presenceMap.entries()));
            await AsyncStorage.setItem(PRESENCE_STORAGE_KEY, data);
        } catch (e) {
            console.error('[حُضُور] Storage error:', e);
        }
    }

    /**
     * تَحْمِيل (Tahmil) - Load from storage
     */
    private async loadFromStorage(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(PRESENCE_STORAGE_KEY);
            if (data) {
                const entries = JSON.parse(data) as [string, PeerPresence][];
                // Mark all as offline initially
                for (const [peerId, presence] of entries) {
                    presence.state = 'ghaib';
                    presence.isTyping = false;
                    this.presenceMap.set(peerId, presence);
                }
                console.log(`[حُضُور] Loaded ${this.presenceMap.size} peer records`);
            }
        } catch (e) {
            console.error('[حُضُور] Load error:', e);
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.stopHeartbeat();
        this.typingTimers.forEach(timer => clearTimeout(timer));
        this.typingTimers.clear();
        this.persistToStorage();
    }
}

// Singleton export
export const hudurManager = new HudurManager();
export default HudurManager;
