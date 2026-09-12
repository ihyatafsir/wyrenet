/**
 * صَوْت (Sawt) - Voice Note Streaming Manager
 * Uses ZBAT Priority 1 (اسْتِعْجَال - ISTI_JAL / Urgent)
 * 
 * Features:
 * - Real-time audio packetization & duration tracking
 * - Acoustic waveform synthesis & ASCII/Unicode visualization
 * - Low-latency ZBAT priority 1 routing
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class SawtManager extends EventEmitter {
    constructor(nodeClient) {
        super();
        this.client = nodeClient;
        
        // Stored voice notes: noteId -> VoiceNote
        this.voiceNotes = new Map();
    }

    /**
     * Synthesize and send a voice note to a peer
     */
    async sendVoiceNote(peerId, durationSec = 3, caption = '') {
        const noteId = 'sawt_' + crypto.randomBytes(6).toString('hex');
        const numSamples = Math.max(12, Math.round(durationSec * 6));
        
        // Synthesize dynamic audio waveform energy envelope
        const waveform = [];
        for (let i = 0; i < numSamples; i++) {
            const normalized = Math.sin((i / numSamples) * Math.PI) * 0.7 + (Math.random() * 0.3);
            waveform.push(Math.min(1.0, Math.max(0.1, Number(normalized.toFixed(2)))));
        }

        // Simulated PCM audio payload (1024 bytes per sec)
        const dummyAudioBytes = crypto.randomBytes(Math.round(durationSec * 1024));
        const audioBase64 = dummyAudioBytes.toString('base64');

        const voicePacket = {
            type: 'SAWT_NOTE',
            noteId,
            from: this.client.identity.fullId,
            to: peerId,
            duration: durationSec,
            caption: caption || `Voice message (${durationSec}s)`,
            waveform,
            audioBase64,
            timestamp: Date.now(),
            daraja: 1 // ISTI_JAL (Urgent priority)
        };

        this.voiceNotes.set(noteId, voicePacket);

        // Send via client with daraja 1 (ISTI_JAL)
        await this.client.sendMessage(peerId, JSON.stringify(voicePacket), 1);

        this.emit('voice_sent', {
            peerId,
            noteId,
            duration: durationSec,
            waveform: this.renderWaveform(waveform)
        });

        return voicePacket;
    }

    /**
     * Handle incoming voice note packet
     */
    handleIncomingSawtPacket(rawContent, fromPeerId) {
        let packet;
        try {
            packet = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        } catch (e) {
            return false;
        }

        if (packet.type !== 'SAWT_NOTE' || !packet.noteId) {
            return false;
        }

        this.voiceNotes.set(packet.noteId, packet);

        const visualWaveform = this.renderWaveform(packet.waveform || []);

        this.emit('voice_received', {
            noteId: packet.noteId,
            from: packet.from || fromPeerId,
            duration: packet.duration,
            caption: packet.caption,
            waveform: packet.waveform,
            visualWaveform,
            timestamp: packet.timestamp
        });

        return true;
    }

    /**
     * Render waveform as Unicode audio bars
     */
    renderWaveform(waveform) {
        const bars = [' ', ' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        return waveform.map(val => {
            const idx = Math.min(bars.length - 1, Math.floor(val * (bars.length - 1)));
            return bars[idx];
        }).join('');
    }
}

module.exports = SawtManager;
