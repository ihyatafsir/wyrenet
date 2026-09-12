/**
 * شَبَح (Shabah) - Steganographic Communication Layer
 * From Lisan al-Arab: "شَبَحَ - phantom, apparition, something seen but hidden"
 * 
 * INVENTION: Hides P2P communication inside innocuous-looking data
 * 
 * Use Cases:
 * 1. Hide encrypted messages in normal text (zero-width characters)
 * 2. Embed P2P data in images (LSB steganography)
 * 3. Encode peer IDs in emoji sequences
 * 4. Tunnel through restrictive networks that inspect content
 * 
 * From Lisan: The شَبَح is something you see but can't quite make out -
 * a phantom between visible and invisible. Our messages are the same:
 * visible as normal text/images, but containing hidden data.
 */

import { Buffer } from 'buffer';

/**
 * طَريقَة الإِخْفَاء (Tariqat al-Ikhfa') - Hiding Method
 */
export type ShabahMethod = 'waswas' | 'lawh' | 'ramz' | 'sawtHidden';
// وَسْوَس (zero-width text) | لَوْح (image LSB) | رَمْز (emoji) | صَوْت (audio)

export interface ShabahPayload {
    method: ShabahMethod;
    carrier: string | Uint8Array;  // Cover data (text, image, etc)
    hidden: string | Uint8Array;   // Hidden payload
    metadata?: {
        peerId?: string;
        timestamp?: number;
        checksum?: string;
    };
}

export interface ShabahResult {
    stegoData: string | Uint8Array;  // Data with hidden payload
    originalSize: number;
    hiddenSize: number;
    capacity: number;  // Max bytes that can be hidden
}

// Zero-width characters for text steganography
const ZERO_WIDTH = {
    SPACE: '\u200B',      // Zero-width space
    JOINER: '\u200D',     // Zero-width joiner
    NON_JOINER: '\u200C', // Zero-width non-joiner
    LEFT_MARK: '\u200E',  // Left-to-right mark
};

// Map bits to zero-width chars (2 bits per char = 4 chars)
const BIT_TO_ZW: Record<string, string> = {
    '00': ZERO_WIDTH.SPACE,
    '01': ZERO_WIDTH.JOINER,
    '10': ZERO_WIDTH.NON_JOINER,
    '11': ZERO_WIDTH.LEFT_MARK,
};

const ZW_TO_BIT: Record<string, string> = {
    [ZERO_WIDTH.SPACE]: '00',
    [ZERO_WIDTH.JOINER]: '01',
    [ZERO_WIDTH.NON_JOINER]: '10',
    [ZERO_WIDTH.LEFT_MARK]: '11',
};

// Emoji alphabet for peer ID encoding (visually random emoji = hidden data)
const EMOJI_ALPHABET = [
    '🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🍃',
    '🦋', '🐝', '🐞', '🦂', '🦀', '🐙', '🐠', '🐟',
    '⭐', '🌙', '☀️', '🌈', '❄️', '🔥', '💧', '🌊',
    '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑',
];

class ShabahStego extends EventTarget {
    constructor() {
        super();
        console.log('[شَبَح] Shabah steganography layer initialized');
    }

    // ═══════════════════════════════════════════════════════════════
    // وَسْوَس (Waswas) - Zero-Width Text Steganography
    // From Lisan: "وَسْوَسَ - to whisper secretly"
    // ═══════════════════════════════════════════════════════════════

    /**
     * أَخْفِ في الكَلام (Akhfi fi al-Kalam) - Hide in text
     * Embeds hidden message using zero-width Unicode characters
     */
    hideInText(coverText: string, hiddenMessage: string): ShabahResult {
        // Convert hidden message to binary
        const binaryData = this.textToBinary(hiddenMessage);

        // Convert binary to zero-width characters (2 bits per char)
        const zwString = this.binaryToZeroWidth(binaryData);

        // Insert zero-width chars after each visible character
        const charArray = Array.from(coverText);
        const charLength = charArray.length;
        const zwLength = zwString.length;

        let result = '';
        let zwIndex = 0;

        for (let i = 0; i < charLength && zwIndex < zwLength; i++) {
            result += charArray[i];
            // Insert some zero-width chars after this char
            const charsToAdd = Math.min(4, zwLength - zwIndex);
            result += zwString.substring(zwIndex, zwIndex + charsToAdd);
            zwIndex += charsToAdd;
        }

        // Append remaining cover text
        if (charLength > Math.ceil(zwIndex / 4)) {
            result += charArray.slice(Math.ceil(zwIndex / 4)).join('');
        }

        // Add marker at end
        result += ZERO_WIDTH.SPACE + ZERO_WIDTH.JOINER + ZERO_WIDTH.JOINER + ZERO_WIDTH.SPACE;

        return {
            stegoData: result,
            originalSize: coverText.length,
            hiddenSize: hiddenMessage.length,
            capacity: Math.floor(coverText.length * 4),
        };
    }

    /**
     * اِكْشِف من الكَلام (Ikshif min al-Kalam) - Extract from text
     */
    extractFromText(stegoText: string): string | null {
        // Find zero-width characters safely
        const zwChars: string[] = [];
        const zeroWidthValues = Object.values(ZERO_WIDTH);

        // Iterate over Array.from to correctly handle all character widths
        const stegoArray = Array.from(stegoText);
        for (let i = 0; i < stegoArray.length; i++) {
            const char = stegoArray[i];
            if (zeroWidthValues.includes(char)) {
                zwChars.push(char);
            }
        }

        if (zwChars.length === 0) return null;

        // Remove end marker (4 chars)
        const dataChars = zwChars.slice(0, -4);

        // Convert back to binary
        const binary = dataChars.map(c => ZW_TO_BIT[c] || '').join('');

        // Convert binary to text
        return this.binaryToText(binary);
    }

    // ═══════════════════════════════════════════════════════════════
    // رَمْز (Ramz) - Emoji Encoding
    // From Lisan: "رَمْزَ - to signal, symbolize"
    // ═══════════════════════════════════════════════════════════════

    /**
     * أَخْفِ في الرَّمْز (Akhfi fi al-Ramz) - Encode data as emoji sequence
     * Looks like random emoji reactions but contains hidden data!
     */
    encodeAsEmoji(data: string): string {
        const bytes = Buffer.from(data, 'utf8');
        const emojis: string[] = [];

        for (const byte of bytes) {
            // High nibble
            emojis.push(EMOJI_ALPHABET[(byte >> 4) & 0x0F]);
            // Low nibble
            emojis.push(EMOJI_ALPHABET[byte & 0x0F]);
        }

        return emojis.join('');
    }

    /**
     * اِكْشِف من الرَّمْز (Ikshif min al-Ramz) - Decode from emoji
     */
    decodeFromEmoji(emojiString: string): string | null {
        try {
            // Find all valid emojis from our alphabet
            const emojis: string[] = [];
            // JavaScript regex for surrogate pairs/emojis matching our alphabet
            // We just extract tokens that exist in EMOJI_ALPHABET
            for (const char of Array.from(emojiString)) {
                if (EMOJI_ALPHABET.includes(char)) {
                    emojis.push(char);
                }
            }

            const bytes: number[] = [];

            for (let i = 0; i < emojis.length - 1; i += 2) {
                const highNibble = EMOJI_ALPHABET.indexOf(emojis[i]);
                const lowNibble = EMOJI_ALPHABET.indexOf(emojis[i + 1]);

                if (highNibble === -1 || lowNibble === -1) continue;

                bytes.push((highNibble << 4) | lowNibble);
            }

            return Buffer.from(bytes).toString('utf8');
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // لَوْح (Lawh) - Image LSB Steganography
    // From Lisan: "لَوْح - tablet, surface"
    // ═══════════════════════════════════════════════════════════════

    /**
     * أَخْفِ في الصُّورَة (Akhfi fi al-Sura) - Hide in image
     * Modifies least significant bits of pixel data
     */
    hideInImage(imageData: Uint8Array, hiddenMessage: string): Uint8Array {
        const binary = this.textToBinary(hiddenMessage);
        const messageBits = binary + '00000000'; // Null terminator

        // Clone image data
        const result = new Uint8Array(imageData);

        // Embed message in LSBs
        let bitIndex = 0;

        for (let i = 0; i < result.length && bitIndex < messageBits.length; i++) {
            // Skip alpha channel (every 4th byte in RGBA)
            if ((i + 1) % 4 === 0) continue;

            // Modify LSB
            const bit = parseInt(messageBits[bitIndex], 2);
            result[i] = (result[i] & 0xFE) | bit;
            bitIndex++;
        }

        console.log(`[شَبَح] Hidden ${hiddenMessage.length} bytes in image`);
        return result;
    }

    /**
     * اِكْشِف من الصُّورَة (Ikshif min al-Sura) - Extract from image
     */
    extractFromImage(imageData: Uint8Array): string | null {
        const bits: string[] = [];

        for (let i = 0; i < imageData.length; i++) {
            // Skip alpha channel
            if ((i + 1) % 4 === 0) continue;

            bits.push((imageData[i] & 1).toString());

            // Check for null terminator every 8 bits
            if (bits.length % 8 === 0 && bits.length >= 8) {
                const lastByte = bits.slice(-8).join('');
                if (lastByte === '00000000') {
                    // Found terminator
                    return this.binaryToText(bits.slice(0, -8).join(''));
                }
            }
        }

        return this.binaryToText(bits.join(''));
    }

    // ═══════════════════════════════════════════════════════════════
    // طَيْف (Tayf) - Spectral/Rainbow Protocol
    // From Lisan: "طَيْف - specter, phantom image"
    // Peer ID exchange that looks like random color codes
    // ═══════════════════════════════════════════════════════════════

    /**
     * Generate "rainbow" color sequence that encodes peer ID
     * Looks like: #ff5733 #33ff57 #5733ff (color palette)
     * Actually: encoded peer data
     */
    encodePeerAsColors(peerId: string, publicKeyHex: string): string[] {
        const data = `${peerId}|${publicKeyHex}`;
        const bytes = Buffer.from(data, 'utf8');
        const colors: string[] = [];

        // 3 bytes (RGB) per color
        for (let i = 0; i < bytes.length; i += 3) {
            const r = bytes[i] || 0;
            const g = bytes[i + 1] || 0;
            const b = bytes[i + 2] || 0;

            colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
        }

        return colors;
    }

    /**
     * Decode peer info from color sequence
     */
    decodePeerFromColors(colors: string[]): { peerId: string; publicKey: string } | null {
        try {
            const bytes: number[] = [];

            for (const color of colors) {
                const hex = color.replace('#', '');
                bytes.push(parseInt(hex.slice(0, 2), 16));
                bytes.push(parseInt(hex.slice(2, 4), 16));
                bytes.push(parseInt(hex.slice(4, 6), 16));
            }

            const data = Buffer.from(bytes).toString('utf8').replace(/\0+$/, '');
            const [peerId, publicKey] = data.split('|');

            return { peerId, publicKey };
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // خَفِيّ (Khafiy) - Invisible Message Protocol
    // From Lisan: "خَفِيّ - hidden, concealed, invisible"
    // Full message in "invisible ink"
    // ═══════════════════════════════════════════════════════════════

    /**
     * Create completely invisible message (only zero-width chars)
     */
    createInvisibleMessage(message: string): string {
        const binary = this.textToBinary(message);
        return ZERO_WIDTH.SPACE + this.binaryToZeroWidth(binary) + ZERO_WIDTH.SPACE;
    }

    /**
     * Read invisible message
     */
    readInvisibleMessage(invisible: string): string | null {
        const zwChars: string[] = [];
        const zeroWidthValues = Object.values(ZERO_WIDTH);

        for (let i = 0; i < invisible.length; i++) {
            const char = invisible.charAt(i);
            if (zeroWidthValues.includes(char)) {
                zwChars.push(char);
            }
        }

        if (zwChars.length < 3) return null;

        // Remove start/end markers
        const dataChars = zwChars.slice(1, -1);
        const binary = dataChars.map(c => ZW_TO_BIT[c] || '').join('');

        return this.binaryToText(binary);
    }

    // ═══════════════════════════════════════════════════════════════
    // Helper Methods
    // ═══════════════════════════════════════════════════════════════

    private textToBinary(text: string): string {
        return Buffer.from(text, 'utf8')
            .reduce((acc, byte) => acc + byte.toString(2).padStart(8, '0'), '');
    }

    private binaryToText(binary: string): string {
        const bytes: number[] = [];
        for (let i = 0; i < binary.length - 7; i += 8) {
            const byte = parseInt(binary.substr(i, 8), 2);
            if (!isNaN(byte)) bytes.push(byte);
        }
        return Buffer.from(bytes).toString('utf8');
    }

    private binaryToZeroWidth(binary: string): string {
        let result = '';
        for (let i = 0; i < binary.length - 1; i += 2) {
            const bits = binary.substr(i, 2).padEnd(2, '0');
            result += BIT_TO_ZW[bits] || '';
        }
        return result;
    }

    /**
     * Calculate hiding capacity for carrier
     */
    calculateCapacity(carrier: string, method: ShabahMethod): number {
        switch (method) {
            case 'waswas':
                // ~1 hidden byte per 2 visible chars
                return Math.floor(carrier.length / 2);
            case 'ramz':
                // 1 byte = 2 emoji
                return Math.floor(carrier.length / 4);
            default:
                return 0;
        }
    }
}

// Singleton export
export const shabahStego = new ShabahStego();
export default ShabahStego;
