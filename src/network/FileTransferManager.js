/**
 * نَقْل المَلَفَّات (Naql al-Malaffat) - Encrypted File Transfer Manager
 * Uses ZBAT Priority 3 (تَأْخِير - TAKHIR / Deferred)
 * 
 * Features:
 * - Chunking (16KB / 32KB) with sequence tracking
 * - End-to-end SHA-256 integrity verification
 * - Automatic reassembly and file persistence
 * - Transfer progress events
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

const DEFAULT_CHUNK_SIZE = 16384; // 16 KB

class FileTransferManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
        this.downloadDir = options.downloadDir || path.join(process.cwd(), 'downloads');
        
        // Active outgoing transfers: transferId -> { filePath, fileName, fileSize, totalChunks, sha256, chunks: Buffer[] }
        this.outgoingTransfers = new Map();
        
        // Active incoming transfers: transferId -> { fileName, fileSize, totalChunks, receivedChunks: Map(index -> Buffer), sha256, from }
        this.incomingTransfers = new Map();

        if (!fs.existsSync(this.downloadDir)) {
            try {
                fs.mkdirSync(this.downloadDir, { recursive: true });
            } catch (e) {}
        }
    }

    /**
     * Prepare a file for chunked transfer
     */
    prepareFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const fileSize = fileBuffer.length;
        const totalChunks = Math.ceil(fileSize / this.chunkSize) || 1;
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const transferId = 'transfer_' + crypto.randomBytes(8).toString('hex');

        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, fileSize);
            chunks.push(fileBuffer.subarray(start, end));
        }

        const metadata = {
            transferId,
            fileName,
            fileSize,
            totalChunks,
            chunkSize: this.chunkSize,
            sha256,
            daraja: 3 // TAKHIR
        };

        this.outgoingTransfers.set(transferId, {
            ...metadata,
            chunks
        });

        return metadata;
    }

    /**
     * Get a specific chunk for transmission
     */
    getChunk(transferId, chunkIndex) {
        const transfer = this.outgoingTransfers.get(transferId);
        if (!transfer) {
            throw new Error(`Transfer ${transferId} not found`);
        }
        if (chunkIndex < 0 || chunkIndex >= transfer.totalChunks) {
            throw new Error(`Invalid chunk index ${chunkIndex} for ${transferId}`);
        }

        const chunkData = transfer.chunks[chunkIndex];
        return {
            transferId,
            chunkIndex,
            totalChunks: transfer.totalChunks,
            dataBase64: chunkData.toString('base64'),
            chunkSha256: crypto.createHash('sha256').update(chunkData).digest('hex')
        };
    }

    /**
     * Register incoming file metadata
     */
    handleIncomingMetadata(meta, from) {
        this.incomingTransfers.set(meta.transferId, {
            transferId: meta.transferId,
            fileName: meta.fileName,
            fileSize: meta.fileSize,
            totalChunks: meta.totalChunks,
            sha256: meta.sha256,
            from,
            receivedChunks: new Map(),
            startedAt: Date.now()
        });

        this.emit('file_offer', {
            transferId: meta.transferId,
            fileName: meta.fileName,
            fileSize: meta.fileSize,
            totalChunks: meta.totalChunks,
            from
        });
    }

    /**
     * Process received chunk
     */
    handleIncomingChunk(chunkPayload, from) {
        const transfer = this.incomingTransfers.get(chunkPayload.transferId);
        if (!transfer) {
            return null;
        }

        const chunkBuffer = Buffer.from(chunkPayload.dataBase64, 'base64');
        const calculatedSha = crypto.createHash('sha256').update(chunkBuffer).digest('hex');

        if (chunkPayload.chunkSha256 && calculatedSha !== chunkPayload.chunkSha256) {
            this.emit('error', new Error(`Corrupted chunk ${chunkPayload.chunkIndex} for transfer ${chunkPayload.transferId}`));
            return null;
        }

        transfer.receivedChunks.set(chunkPayload.chunkIndex, chunkBuffer);
        const progress = Math.round((transfer.receivedChunks.size / transfer.totalChunks) * 100);

        this.emit('transfer_progress', {
            transferId: transfer.transferId,
            fileName: transfer.fileName,
            receivedChunks: transfer.receivedChunks.size,
            totalChunks: transfer.totalChunks,
            progress,
            from
        });

        // Check if all chunks received
        if (transfer.receivedChunks.size === transfer.totalChunks) {
            return this.finalizeTransfer(transfer.transferId);
        }

        return null;
    }

    /**
     * Reassemble and verify complete file
     */
    finalizeTransfer(transferId) {
        const transfer = this.incomingTransfers.get(transferId);
        if (!transfer) return null;

        const orderedChunks = [];
        for (let i = 0; i < transfer.totalChunks; i++) {
            const chunk = transfer.receivedChunks.get(i);
            if (!chunk) {
                throw new Error(`Missing chunk ${i} for transfer ${transferId}`);
            }
            orderedChunks.push(chunk);
        }

        const finalBuffer = Buffer.concat(orderedChunks);
        const finalSha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');

        if (finalSha256 !== transfer.sha256) {
            this.emit('error', new Error(`Integrity check failed for ${transfer.fileName}: Expected ${transfer.sha256}, got ${finalSha256}`));
            this.incomingTransfers.delete(transferId);
            return null;
        }

        // Save file
        const savePath = path.join(this.downloadDir, transfer.fileName);
        fs.writeFileSync(savePath, finalBuffer);

        const result = {
            transferId,
            fileName: transfer.fileName,
            fileSize: finalBuffer.length,
            savedPath: savePath,
            sha256: finalSha256,
            from: transfer.from,
            duration: Date.now() - transfer.startedAt
        };

        this.incomingTransfers.delete(transferId);
        this.emit('file_received', result);
        return result;
    }
}

module.exports = FileTransferManager;
