/**
 * صَوْت (Sawt) - Voice Note Manager
 * From Lisan al-Arab: "صَوْت - sound, voice"
 * 
 * Records, compresses, and transmits voice notes between peers
 * Uses Arabic roots for all operations:
 * - سَجَّل (Sajjal): Record
 * - وَقَف (Waqaf): Stop
 * - أَرْسَل (Arsal): Send
 * - شَغَّل (Shaghghal): Play
 */

import { Platform } from 'react-native';

// Note: Requires react-native-audio-recorder-player package
// This is a type-safe interface that will work when the package is installed

/**
 * حَالَة التَّسْجِيل (Halat al-Tasjil) - Recording State
 */
export type RecordingState = 'sakin' | 'yusajjil' | 'mutawaqqif' | 'mursil';
// سَاكِن (idle) | يُسَجِّل (recording) | مُتَوَقِّف (stopped) | مُرْسِل (sending)

export interface VoiceNote {
    id: string;
    filePath: string;
    duration: number; // seconds
    size: number; // bytes
    timestamp: number;
    waveform?: number[]; // Audio waveform for visualization
}

export interface VoiceNoteMessage {
    type: 'SAWT';
    from: string;
    to?: string;
    noteId: string;
    duration: number;
    // Base64 encoded audio data (for small notes < 100KB)
    // or reference ID for larger files
    data: string;
    isChunk?: boolean;
    chunkIndex?: number;
    totalChunks?: number;
}

// Callback types
type RecordingCallback = (state: RecordingState, duration: number) => void;
type PlaybackCallback = (position: number, duration: number) => void;

class SawtManager {
    private state: RecordingState = 'sakin';
    private currentRecording: VoiceNote | null = null;
    private recordingTimer: ReturnType<typeof setInterval> | null = null;
    private recordingDuration: number = 0;

    private onRecordingChange?: RecordingCallback;
    private onPlaybackChange?: PlaybackCallback;

    // Configuration
    private maxDuration = 60; // Max 60 seconds
    private sampleRate = 22050;
    private bitRate = 32000;
    private audioFormat = Platform.OS === 'ios' ? 'm4a' : 'aac';

    constructor() {
        console.log('[صَوْت] Sawt voice manager initialized');
    }

    /**
     * سَجِّل (Sajjil) - Start recording
     * From Lisan: "سَجَّلَ - to record, register"
     */
    async startRecording(): Promise<string> {
        if (this.state === 'yusajjil') {
            console.warn('[صَوْت] Already recording');
            return '';
        }

        try {
            // Generate unique file path
            const noteId = `sawt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const filePath = `${this.getTempDir()}/${noteId}.${this.audioFormat}`;

            console.log(`[صَوْت] سَجِّل - Starting recording: ${noteId}`);

            // Note: Actual recording would use react-native-audio-recorder-player
            // This is the interface structure

            this.state = 'yusajjil';
            this.recordingDuration = 0;
            this.currentRecording = {
                id: noteId,
                filePath,
                duration: 0,
                size: 0,
                timestamp: Date.now(),
            };

            // Start duration timer
            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;
                this.onRecordingChange?.(this.state, this.recordingDuration);

                // Auto-stop at max duration
                if (this.recordingDuration >= this.maxDuration) {
                    this.stopRecording();
                }
            }, 1000);

            this.onRecordingChange?.(this.state, 0);
            return noteId;
        } catch (error) {
            console.error('[صَوْت] Recording failed:', error);
            this.state = 'sakin';
            throw error;
        }
    }

    /**
     * وَقِف (Waqif) - Stop recording
     * From Lisan: "وَقَفَ - to stop, halt"
     */
    async stopRecording(): Promise<VoiceNote | null> {
        if (this.state !== 'yusajjil') {
            console.warn('[صَوْت] Not recording');
            return null;
        }

        try {
            console.log('[صَوْت] وَقِف - Stopping recording');

            // Clear timer
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            // Note: Actual stop would be:
            // const result = await audioRecorderPlayer.stopRecorder();

            if (this.currentRecording) {
                this.currentRecording.duration = this.recordingDuration;
                // Size would come from file stats
                this.currentRecording.size = this.recordingDuration * (this.bitRate / 8);
            }

            this.state = 'mutawaqqif';
            this.onRecordingChange?.(this.state, this.recordingDuration);

            const note = this.currentRecording;
            return note;
        } catch (error) {
            console.error('[صَوْت] Stop failed:', error);
            this.state = 'sakin';
            throw error;
        }
    }

    /**
     * أَلْغِ (Alghi) - Cancel recording
     * From Lisan: "أَلْغَى - to cancel, nullify"
     */
    async cancelRecording(): Promise<void> {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        if (this.currentRecording) {
            // Delete the temp file
            console.log(`[صَوْت] أَلْغِ - Cancelled: ${this.currentRecording.id}`);
            // await RNFS.unlink(this.currentRecording.filePath);
        }

        this.state = 'sakin';
        this.currentRecording = null;
        this.recordingDuration = 0;
        this.onRecordingChange?.(this.state, 0);
    }

    /**
     * شَغِّل (Shaghghil) - Play voice note
     * From Lisan: "شَغَّلَ - to operate, play"
     */
    async playNote(note: VoiceNote): Promise<void> {
        try {
            console.log(`[صَوْت] شَغِّل - Playing: ${note.id}`);

            // Note: Actual playback would be:
            // await audioRecorderPlayer.startPlayer(note.filePath);

            // Simulate playback progress
            let position = 0;
            const interval = setInterval(() => {
                position++;
                this.onPlaybackChange?.(position, note.duration);

                if (position >= note.duration) {
                    clearInterval(interval);
                    this.onPlaybackChange?.(0, note.duration);
                }
            }, 1000);
        } catch (error) {
            console.error('[صَوْت] Playback failed:', error);
            throw error;
        }
    }

    /**
     * أَعِدّ لِلإِرْسَال (A'idd lil-Irsal) - Prepare for sending
     * Converts voice note to base64 or chunks for transmission
     */
    async prepareForSending(
        note: VoiceNote,
        fromId: string,
        toId?: string
    ): Promise<VoiceNoteMessage[]> {
        console.log(`[صَوْت] أَعِدّ لِلإِرْسَال - Preparing: ${note.id}`);

        // For small files, send as single base64 message
        // For larger files, chunk into multiple messages

        const MAX_CHUNK_SIZE = 64 * 1024; // 64KB chunks

        if (note.size < MAX_CHUNK_SIZE) {
            // Single message
            return [{
                type: 'SAWT',
                from: fromId,
                to: toId,
                noteId: note.id,
                duration: note.duration,
                data: '', // Would be base64 encoded audio
                isChunk: false,
            }];
        } else {
            // Multiple chunks
            const totalChunks = Math.ceil(note.size / MAX_CHUNK_SIZE);
            const messages: VoiceNoteMessage[] = [];

            for (let i = 0; i < totalChunks; i++) {
                messages.push({
                    type: 'SAWT',
                    from: fromId,
                    to: toId,
                    noteId: note.id,
                    duration: note.duration,
                    data: '', // Would be chunk data
                    isChunk: true,
                    chunkIndex: i,
                    totalChunks,
                });
            }

            return messages;
        }
    }

    /**
     * اِسْتَلِم (Istalim) - Receive and reassemble voice note
     * From Lisan: "اِسْتَلَمَ - to receive"
     */
    async receiveNote(message: VoiceNoteMessage): Promise<VoiceNote | null> {
        console.log(`[صَوْت] اِسْتَلِم - Receiving: ${message.noteId}`);

        if (!message.isChunk) {
            // Single message, decode and save
            const note: VoiceNote = {
                id: message.noteId,
                filePath: `${this.getTempDir()}/received_${message.noteId}.${this.audioFormat}`,
                duration: message.duration,
                size: message.data.length * 0.75, // Approximate decoded size
                timestamp: Date.now(),
            };

            // Would save base64 decoded data to file
            return note;
        } else {
            // Chunked message, need to reassemble
            // This would track chunks in a Map and reassemble when complete
            console.log(`[صَوْت] Chunk ${message.chunkIndex}/${message.totalChunks}`);
            return null; // Return note when all chunks received
        }
    }

    /**
     * Get temp directory for recordings
     */
    private getTempDir(): string {
        // Platform-specific temp directory
        return Platform.OS === 'ios'
            ? '/tmp/wyresup_voice'
            : '/data/data/com.wyresup.app/cache/voice';
    }

    /**
     * Get current state
     */
    getState(): RecordingState {
        return this.state;
    }

    /**
     * Get recording duration
     */
    getDuration(): number {
        return this.recordingDuration;
    }

    // Event handlers
    setOnRecordingChange(handler: RecordingCallback): void {
        this.onRecordingChange = handler;
    }

    setOnPlaybackChange(handler: PlaybackCallback): void {
        this.onPlaybackChange = handler;
    }
}

// Singleton export
export const sawtManager = new SawtManager();
export default SawtManager;
