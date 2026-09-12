/**
 * Arabic Lexical Cryptography & P2P Mesh Engine v2.0 (TypeScript Edition)
 * =======================================================================
 * Synthesized from Classical Arabic Linguistic Treatises (Kitāb Sībawayh,
 * Kitāb al-ʿAyn, Maqāyīs al-Lughah, and ʿIlm al-Taʿmiyah).
 */

import * as crypto from 'crypto';

// ============================================================================
// 1. SĪBAWAYH 4-ROUND SPN CIPHER
// ============================================================================

export class SibawayhSPNCipher {
    public static readonly PHONETIC_FEATURES: Record<string, number[]> = {
        'ء': [0, 2, 0, 0, 0, 0],
        'ه': [0, 0, 0, 0, 0, 0],
        'ع': [1, 1, 0, 0, 0, 0],
        'ح': [0, 0, 0, 0, 0, 0],
        'غ': [1, 0, 0, 1, 0, 0],
        'خ': [0, 0, 1, 1, 0, 0],
        'ق': [1, 2, 0, 1, 1, 0],
        'ك': [0, 2, 0, 0, 0, 0],
        'ج': [1, 2, 0, 0, 1, 0],
        'ش': [0, 0, 0, 0, 0, 0],
        'ي': [1, 0, 0, 0, 0, 0],
        'ض': [1, 0, 1, 1, 0, 0],
        'ل': [1, 1, 0, 0, 0, 0],
        'ن': [1, 1, 0, 0, 0, 1],
        'ر': [1, 1, 0, 0, 0, 0],
        'ط': [1, 2, 1, 1, 1, 0],
        'د': [1, 2, 0, 0, 1, 0],
        'ت': [0, 2, 0, 0, 0, 0],
        'ص': [0, 0, 1, 1, 0, 0],
        'ز': [1, 0, 0, 0, 0, 0],
        'س': [0, 0, 0, 0, 0, 0],
        'ظ': [1, 0, 1, 1, 0, 0],
        'ذ': [1, 0, 0, 0, 0, 0],
        'ث': [0, 0, 0, 0, 0, 0],
        'ف': [0, 0, 0, 0, 0, 0],
        'ب': [1, 2, 0, 0, 1, 0],
        'م': [1, 1, 0, 0, 0, 1],
        'و': [1, 0, 0, 0, 0, 0],
        'ا': [1, 0, 0, 0, 0, 0]
    };

    public static readonly LETTERS = Object.keys(SibawayhSPNCipher.PHONETIC_FEATURES);
    public static readonly N_LETTERS = SibawayhSPNCipher.LETTERS.length;
    public static readonly LETTER_TO_IDX = new Map(SibawayhSPNCipher.LETTERS.map((c, i) => [c, i]));

    public static generateRoundSbox(roundKey: Buffer): Map<number, number> {
        const scored: Array<{ score: number; idx: number }> = [];
        for (let idx = 0; idx < SibawayhSPNCipher.N_LETTERS; idx++) {
            const char = SibawayhSPNCipher.LETTERS[idx];
            const feats = SibawayhSPNCipher.PHONETIC_FEATURES[char];
            let featInt = 0;
            for (let i = 0; i < feats.length; i++) {
                featInt |= (feats[i] << (i * 2));
            }
            const buf = Buffer.alloc(4);
            buf.writeUInt16BE(featInt, 0);
            buf.writeUInt16BE(idx, 2);
            const h = crypto.createHash('sha256').update(roundKey).update(buf).digest();
            const score = h.readUInt32BE(0);
            scored.push({ score, idx });
        }
        scored.sort((a, b) => a.score - b.score);
        const fwdSbox = new Map<number, number>();
        for (let i = 0; i < SibawayhSPNCipher.N_LETTERS; i++) {
            fwdSbox.set(i, scored[i].idx);
        }
        return fwdSbox;
    }

    public static idghamDiffusion(state: number[]): number[] {
        const L = state.length;
        if (L <= 1) return [...state];
        const diffused = new Array(L);
        for (let i = 0; i < L; i++) {
            const prev = state[(i - 1 + L) % L];
            const curr = state[i];
            const next = state[(i + 1) % L];
            diffused[i] = (curr * 2 + prev * 3 + next) % SibawayhSPNCipher.N_LETTERS;
        }
        return diffused;
    }

    public static qalbPermutation(state: number[], roundIdx: number): number[] {
        const L = state.length;
        if (L <= 1) return [...state];
        const stride = (3 + roundIdx * 2) % L || 1;
        const permuted = new Array(L);
        for (let i = 0; i < L; i++) {
            permuted[(i * stride) % L] = state[i];
        }
        return permuted;
    }

    public static encryptBlock(plaintext: string, key: Buffer, rounds: number = 4): string {
        const chars = plaintext.split('').filter(c => SibawayhSPNCipher.LETTER_TO_IDX.has(c));
        let state = chars.map(c => SibawayhSPNCipher.LETTER_TO_IDX.get(c)!);
        if (state.length === 0) return '';

        const roundKeys: Buffer[] = [];
        for (let r = 0; r < rounds; r++) {
            const rBuf = Buffer.alloc(2);
            rBuf.writeUInt16BE(r, 0);
            roundKeys.push(crypto.createHash('sha256').update(key).update(rBuf).digest());
        }

        for (let r = 0; r < rounds; r++) {
            const sbox = SibawayhSPNCipher.generateRoundSbox(roundKeys[r]);
            const keyByte = roundKeys[r][0] % SibawayhSPNCipher.N_LETTERS;

            // 1. Key Addition
            state = state.map(val => (val + keyByte) % SibawayhSPNCipher.N_LETTERS);
            // 2. S-Box Substitution (Ibdāl)
            state = state.map(val => sbox.get(val)!);
            // 3. Diffusion (Idghām)
            state = SibawayhSPNCipher.idghamDiffusion(state);
            // 4. Permutation (Qalb)
            state = SibawayhSPNCipher.qalbPermutation(state, r);
        }

        return state.map(idx => SibawayhSPNCipher.LETTERS[idx]).join('');
    }
}

// ============================================================================
// 2. AL-KHALĪL HKDF ANATOMICAL RATCHET
// ============================================================================

export class AlKhalilRatchetEngine {
    public static readonly AL_KHALIL_ORDER = [
        'ع', 'ح', 'ه', 'خ', 'غ',
        'ق', 'ك',
        'ج', 'ش', 'ض',
        'ص', 'س', 'ز',
        'ط', 'د', 'ت',
        'ظ', 'ذ', 'ث',
        'ر', 'ل', 'ن',
        'ف', 'ب', 'م',
        'و', 'ي', 'ء', 'ا'
    ];

    public static deriveAnatomicalStep(currentChainKey: Buffer, stepIndex: number): { msgKey: Buffer; nextChain: Buffer } {
        const anchorChar = AlKhalilRatchetEngine.AL_KHALIL_ORDER[stepIndex % AlKhalilRatchetEngine.AL_KHALIL_ORDER.length];
        const info = `HALQ_LIPS_RATCHET_${anchorChar}_${stepIndex}`;
        
        const msgKey = crypto.hkdfSync('sha256', currentChainKey, Buffer.alloc(0), Buffer.from(`${info}:MESSAGE_KEY`), 32);
        const nextChain = crypto.hkdfSync('sha256', currentChainKey, Buffer.alloc(0), Buffer.from(`${info}:NEXT_CHAIN`), 32);

        return {
            msgKey: Buffer.from(msgKey),
            nextChain: Buffer.from(nextChain)
        };
    }
}

// ============================================================================
// 3. MAQĀYĪS MORPHO-EXTRACTOR
// ============================================================================

export class MaqayisMorphoExtractor {
    public static extractRoot(word: string): string {
        const clean = word.split('').filter(c => SibawayhSPNCipher.LETTER_TO_IDX.has(c)).join('');
        if (clean.length <= 3) return clean;

        let stripped = clean;
        const prefixes = ["واست", "فاست", "وبال", "فبال", "كال", "است", "مست", "مت", "ال", "لل", "وا", "فا"];
        for (const p of prefixes) {
            if (stripped.startsWith(p) && stripped.length - p.length >= 3) {
                stripped = stripped.substring(p.length);
                break;
            }
        }

        const suffixes = ["تموها", "تكم", "تنا", "ونها", "ينها", "اتهم", "اتها", "ون", "ين", "ات", "ان", "ية", "هم", "هن", "كم", "نا", "ها", "ته", "تك"];
        for (const s of suffixes) {
            if (stripped.endsWith(s) && stripped.length - s.length >= 3) {
                stripped = stripped.substring(0, stripped.length - s.length);
                break;
            }
        }

        if (stripped.length === 3) return stripped;

        // Scale: Ifti'āl (انتصار -> نصر)
        if (stripped.length === 6 && stripped[0] === 'ا' && stripped[2] === 'ت' && stripped[4] === 'ا') {
            return stripped[1] + stripped[3] + stripped[5];
        }

        // Scale: Fi'āl (خراج -> خرج, قبال -> قبل)
        if (stripped.length === 4 && stripped[2] === 'ا') {
            return stripped[0] + stripped[1] + stripped[3];
        }

        // Scale: Ifta'ala (اكتشف -> كشف)
        if (stripped.length === 5 && stripped[0] === 'ا' && stripped[2] === 'ت') {
            return stripped[1] + stripped[3] + stripped[4];
        }

        // Scale: Mutafe'il (منتصر -> نصر)
        if (stripped.length === 5 && stripped[0] === 'م' && stripped[2] === 'ت') {
            return stripped[1] + stripped[3] + stripped[4];
        }

        // Scale: Taf'īl (تحويل -> حول)
        if (stripped.length === 5 && stripped[0] === 'ت' && stripped[3] === 'ي') {
            return stripped[1] + stripped[2] + stripped[4];
        }

        return stripped.substring(0, 3);
    }
}
