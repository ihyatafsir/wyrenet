"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiftahEngine = void 0;
exports.MAX_PUNCTURES = 1000;

const ed = require("@noble/ed25519");
const CryptoShim_1 = require("../utils/CryptoShim");

const AHD_DURATION = 24 * 60 * 60 * 1000;
const CURVE_N = 2n**252n + 27742317777372353535851937790883648493n;

function deriveSharedPoint(myPrivateKey, peerPublicKey) {
    try {
        const hash = ed.hashes.sha512(myPrivateKey);
        const d = new Uint8Array(hash.slice(0, 32));
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        let n = 0n;
        for (let i = 0; i < d.length; i++) n += BigInt(d[i]) << (8n * BigInt(i));
        const scalar = (n % CURVE_N) || 1n;
        const p = ed.Point.fromHex(ed.etc.bytesToHex(peerPublicKey));
        return p.multiply(scalar).toBytes();
    } catch (e) {
        const combined = new Uint8Array([...myPrivateKey, ...peerPublicKey]);
        return (0, CryptoShim_1.sha256)(combined);
    }
}

async function deriveSequenceKey(masterSecret, sequence) {
    const seqBytes = new Uint8Array(8);
    new DataView(seqBytes.buffer).setBigUint64(0, BigInt(sequence), false);
    const material = new Uint8Array([...masterSecret, ...seqBytes]);
    return (0, CryptoShim_1.sha256)(material);
}

class MiftahEngine {
    constructor() {
        this.keys = new Map();
    }

    async fataha(peerId, myPrivateKey, peerPublicKey) {
        console.log(`[MIFTAH] فَتَحَ (Fataha) - Creating key for ${peerId}`);
        const combined = new Uint8Array([...myPrivateKey, ...peerPublicKey]);
        const masterSecret = (0, CryptoShim_1.sha512)(combined);
        const miftah = {
            peerId,
            masterSecret,
            puncturedSequences: new Set(),
            currentSequence: 0,
            created: Date.now(),
            lastPunctured: Date.now(),
            ahdExpiry: Date.now() + AHD_DURATION,
            peerPublicKey,
        };
        this.keys.set(peerId, miftah);
        return miftah;
    }

    async aqd(peerId, myPrivateKey, peerPublicKey) {
        console.log(`[MIFTAH] عَقْد (Aqd) - Binding with ${peerId}`);
        const sirr = deriveSharedPoint(myPrivateKey, peerPublicKey);
        const masterSecret = (0, CryptoShim_1.sha512)(new Uint8Array([...sirr, ...new TextEncoder().encode('miftah-sirr')]));
        const miftah = {
            peerId,
            masterSecret,
            puncturedSequences: new Set(),
            currentSequence: 0,
            created: Date.now(),
            lastPunctured: Date.now(),
            ahdExpiry: Date.now() + AHD_DURATION,
            peerPublicKey,
        };
        this.keys.set(peerId, miftah);
        console.log(`[MIFTAH] [OK] عَقْد complete, عَهْد expires in 24h`);
        return miftah;
    }

    async tashfir(peerId, plaintext) {
        const miftah = this.keys.get(peerId);
        if (!miftah) {
            console.error(`[MIFTAH] No key for ${peerId}`);
            return null;
        }
        const sequence = miftah.currentSequence++;
        const seqKey = await deriveSequenceKey(miftah.masterSecret, sequence);
        const plaintextBytes = new TextEncoder().encode(plaintext);
        const encrypted = new Uint8Array(plaintextBytes.length);
        for (let i = 0; i < plaintextBytes.length; i++) {
            encrypted[i] = plaintextBytes[i] ^ seqKey[i % seqKey.length];
        }
        const result = new Uint8Array(4 + encrypted.length);
        new DataView(result.buffer).setUint32(0, sequence, false);
        result.set(encrypted, 4);
        console.log(`[MIFTAH] تَشْفِير seq=${sequence}`);
        return {
            encrypted: Buffer.from(result).toString('base64'),
            sequence,
        };
    }

    thaqb(miftah, sequence) {
        miftah.puncturedSequences.add(sequence);
        miftah.lastPunctured = Date.now();
        console.log(`[MIFTAH] ثَقْب (Thaqb) - Punctured seq=${sequence}`);
    }

    async fakk(peerId, encryptedBase64) {
        const miftah = this.keys.get(peerId);
        if (!miftah) {
            console.error(`[MIFTAH] No key for ${peerId}`);
            return null;
        }
        const data = Buffer.from(encryptedBase64, 'base64');
        const sequence = new DataView(data.buffer, data.byteOffset).getUint32(0, false);
        const ciphertext = data.slice(4);
        if (miftah.puncturedSequences.has(sequence)) {
            console.error(`[MIFTAH] [WARN] REPLAY DETECTED! seq=${sequence} already punctured`);
            return null;
        }
        const seqKey = await deriveSequenceKey(miftah.masterSecret, sequence);
        try {
            const plaintext = new Uint8Array(ciphertext.length);
            for (let i = 0; i < ciphertext.length; i++) {
                plaintext[i] = ciphertext[i] ^ seqKey[i % seqKey.length];
            }
            this.thaqb(miftah, sequence);
            console.log(`[MIFTAH] فَكّ (Fakk) seq=${sequence} [OK]`);
            return new TextDecoder().decode(plaintext);
        } catch (_a) {
            console.error(`[MIFTAH] Decryption failed seq=${sequence}`);
            return null;
        }
    }

    needsRotation(peerId) {
        const miftah = this.keys.get(peerId);
        if (!miftah) return true;
        return miftah.puncturedSequences.size >= exports.MAX_PUNCTURES;
    }

    aghlaqa(peerId) {
        const miftah = this.keys.get(peerId);
        if (miftah) {
            miftah.masterSecret.fill(0);
            miftah.puncturedSequences.clear();
            this.keys.delete(peerId);
            console.log(`[MIFTAH] أَغْلَق (Aghlaqa) - Key destroyed for ${peerId}`);
        }
    }

    getStats(peerId) {
        const miftah = this.keys.get(peerId);
        if (!miftah) return null;
        return {
            punctured: miftah.puncturedSequences.size,
            currentSequence: miftah.currentSequence,
            age: Date.now() - miftah.created,
        };
    }

    tasis(myId, peerId) {
        console.log(`[MIFTAH] تَأْسِيس (Ta'sis) - Establishing key with ${peerId}`);
        const sortedIds = [myId, peerId].sort();
        const combined = sortedIds.join('::');
        const masterSecret = (0, CryptoShim_1.sha256)(new TextEncoder().encode(combined));
        const miftah = {
            peerId,
            masterSecret,
            puncturedSequences: new Set(),
            currentSequence: 0,
            created: Date.now(),
            lastPunctured: Date.now(),
            ahdExpiry: Date.now() + AHD_DURATION,
        };
        this.keys.set(peerId, miftah);
        console.log(`[MIFTAH] [OK] Key established for ${peerId.split('@')[0]}`);
        return miftah;
    }

    hasMiftah(peerId) {
        return this.keys.has(peerId);
    }
}

exports.MiftahEngine = MiftahEngine;

// Default singleton for backwards compatibility
const defaultEngine = new MiftahEngine();
exports.fataha = defaultEngine.fataha.bind(defaultEngine);
exports.aqd = defaultEngine.aqd.bind(defaultEngine);
exports.tashfir = defaultEngine.tashfir.bind(defaultEngine);
exports.fakk = defaultEngine.fakk.bind(defaultEngine);
exports.needsRotation = defaultEngine.needsRotation.bind(defaultEngine);
exports.aghlaqa = defaultEngine.aghlaqa.bind(defaultEngine);
exports.getStats = defaultEngine.getStats.bind(defaultEngine);
exports.tasis = defaultEngine.tasis.bind(defaultEngine);
exports.hasMiftah = defaultEngine.hasMiftah.bind(defaultEngine);
