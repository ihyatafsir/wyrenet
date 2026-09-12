/**
 * طَابُور الرِّسَالَات (Tabur al-Risalat) - Message Queue
 * From Lisan al-Arab: "طَابُور - queue, line" | "رِسَالَة - message"
 * 
 * Provides offline message queuing with persistence and retry logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@wyresup_message_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 15000, 30000]; // Exponential backoff

export type MessageStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'delivered';

export interface QueuedMessage {
    id: string;
    peerId: string;
    content: string;
    encrypted: boolean;
    timestamp: number;
    retries: number;
    status: MessageStatus;
    lastAttempt?: number;
    error?: string;
}

type SendFunction = (peerId: string, content: string, encrypted: boolean) => Promise<boolean>;
type StatusCallback = (messageId: string, status: MessageStatus) => void;

class MessageQueue {
    private queue: Map<string, QueuedMessage> = new Map();
    private sendFunction: SendFunction | null = null;
    private onStatusChange: StatusCallback | null = null;
    private processingInterval: ReturnType<typeof setInterval> | null = null;
    private isProcessing = false;

    constructor() {
        console.log('[طَابُور] Message queue initialized');
        this.loadFromStorage();
    }

    /**
     * تَهْيِئَة (Tahi'a) - Initialize with send function
     */
    initialize(sendFn: SendFunction, statusCallback?: StatusCallback): void {
        this.sendFunction = sendFn;
        this.onStatusChange = statusCallback || null;
        this.startProcessing();
    }

    /**
     * إِضَافَة (Idafa) - Add message to queue
     */
    async enqueue(
        peerId: string,
        content: string,
        encrypted: boolean = false
    ): Promise<string> {
        const message: QueuedMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            peerId,
            content,
            encrypted,
            timestamp: Date.now(),
            retries: 0,
            status: 'pending',
        };

        this.queue.set(message.id, message);
        await this.persistToStorage();

        console.log(`[طَابُور] Enqueued: ${message.id}`);
        this.onStatusChange?.(message.id, 'pending');

        // Try to send immediately
        this.processQueue();

        return message.id;
    }

    /**
     * مُعَالَجَة (Mu'alaja) - Process queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || !this.sendFunction) return;
        this.isProcessing = true;

        const pendingMessages = Array.from(this.queue.values())
            .filter(m => m.status === 'pending' || m.status === 'sending')
            .sort((a, b) => a.timestamp - b.timestamp);

        for (const message of pendingMessages) {
            // Check retry delay
            if (message.lastAttempt) {
                const delay = RETRY_DELAYS[Math.min(message.retries, RETRY_DELAYS.length - 1)];
                if (Date.now() - message.lastAttempt < delay) {
                    continue; // Not time to retry yet
                }
            }

            // Mark as sending
            message.status = 'sending';
            message.lastAttempt = Date.now();
            this.queue.set(message.id, message);
            this.onStatusChange?.(message.id, 'sending');

            try {
                const success = await this.sendFunction(
                    message.peerId,
                    message.content,
                    message.encrypted
                );

                if (success) {
                    message.status = 'sent';
                    console.log(`[طَابُور] ✓ Sent: ${message.id}`);
                    this.onStatusChange?.(message.id, 'sent');

                    // Remove from queue after successful send
                    setTimeout(() => {
                        this.queue.delete(message.id);
                        this.persistToStorage();
                    }, 5000);
                } else {
                    throw new Error('Send returned false');
                }
            } catch (error: any) {
                message.retries++;
                message.error = error.message;

                if (message.retries >= MAX_RETRIES) {
                    message.status = 'failed';
                    console.log(`[طَابُور] ✗ Failed permanently: ${message.id}`);
                    this.onStatusChange?.(message.id, 'failed');
                } else {
                    message.status = 'pending';
                    console.log(`[طَابُور] Retry ${message.retries}/${MAX_RETRIES}: ${message.id}`);
                }
            }

            this.queue.set(message.id, message);
        }

        await this.persistToStorage();
        this.isProcessing = false;
    }

    /**
     * Start background processing
     */
    private startProcessing(): void {
        if (this.processingInterval) return;

        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, 3000);

        console.log('[طَابُور] Background processing started');
    }

    /**
     * Stop background processing
     */
    stopProcessing(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    /**
     * Get message status
     */
    getStatus(messageId: string): MessageStatus | null {
        return this.queue.get(messageId)?.status || null;
    }

    /**
     * Get all pending messages
     */
    getPending(): QueuedMessage[] {
        return Array.from(this.queue.values())
            .filter(m => m.status === 'pending' || m.status === 'sending');
    }

    /**
     * Get failed messages for retry
     */
    getFailed(): QueuedMessage[] {
        return Array.from(this.queue.values())
            .filter(m => m.status === 'failed');
    }

    /**
     * Retry failed message
     */
    async retry(messageId: string): Promise<void> {
        const message = this.queue.get(messageId);
        if (message && message.status === 'failed') {
            message.status = 'pending';
            message.retries = 0;
            message.error = undefined;
            this.queue.set(messageId, message);
            await this.persistToStorage();
            this.processQueue();
        }
    }

    /**
     * Clear all messages
     */
    async clear(): Promise<void> {
        this.queue.clear();
        await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    }

    /**
     * تَخْزِين (Takhzin) - Persist to storage
     */
    private async persistToStorage(): Promise<void> {
        try {
            const data = JSON.stringify(Array.from(this.queue.entries()));
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, data);
        } catch (e) {
            console.error('[طَابُور] Storage error:', e);
        }
    }

    /**
     * تَحْمِيل (Tahmil) - Load from storage
     */
    private async loadFromStorage(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
            if (data) {
                const entries = JSON.parse(data) as [string, QueuedMessage][];
                this.queue = new Map(entries);

                // Reset 'sending' status to 'pending' on load
                for (const [id, msg] of this.queue) {
                    if (msg.status === 'sending') {
                        msg.status = 'pending';
                        this.queue.set(id, msg);
                    }
                }

                console.log(`[طَابُور] Loaded ${this.queue.size} queued messages`);
            }
        } catch (e) {
            console.error('[طَابُور] Load error:', e);
        }
    }

    /**
     * Get queue statistics
     */
    getStats(): {
        total: number;
        pending: number;
        sending: number;
        sent: number;
        failed: number;
    } {
        const stats = { total: 0, pending: 0, sending: 0, sent: 0, failed: 0 };
        for (const msg of this.queue.values()) {
            stats.total++;
            stats[msg.status as keyof typeof stats]++;
        }
        return stats;
    }
}

// Singleton export
export const messageQueue = new MessageQueue();
export default MessageQueue;
