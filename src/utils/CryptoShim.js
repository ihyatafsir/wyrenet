"use strict";
/**
 * Crypto Shim for React Native
 * Provides crypto.subtle-like functions using pure JS implementations
 *
 * This avoids the "Cannot read property 'digest' of undefined" error
 * that occurs when crypto.subtle is not available in React Native
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.sha512 = sha512;
exports.bytesToHex = bytesToHex;
exports.xorEncrypt = xorEncrypt;
exports.xorDecrypt = xorDecrypt;
exports.deriveKey = deriveKey;
exports.simpleEncrypt = simpleEncrypt;
exports.simpleDecrypt = simpleDecrypt;
const js_sha256_1 = require("js-sha256");
const js_sha512_1 = require("js-sha512");
/**
 * SHA-256 hash (replacement for crypto.subtle.digest('SHA-256', ...))
 */
function sha256(data) {
    const hex = (0, js_sha256_1.sha256)(data);
    return hexToBytes(hex);
}
/**
 * SHA-512 hash (replacement for crypto.subtle.digest('SHA-512', ...))
 */
function sha512(data) {
    const hex = (0, js_sha512_1.sha512)(data);
    return hexToBytes(hex);
}
/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Simple XOR-based encryption (fallback when AES-GCM not available)
 * NOT cryptographically secure for production - use for testing only
 *
 * In production, use a native crypto module or realm
 */
function xorEncrypt(data, key) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length];
    }
    return result;
}
/**
 * XOR decrypt (same as encrypt for XOR)
 */
function xorDecrypt(data, key) {
    return xorEncrypt(data, key);
}
/**
 * Derive a key using HKDF-like expansion
 * Uses SHA-256 for key derivation
 */
function deriveKey(secret, info, length = 32) {
    const combined = new Uint8Array(secret.length + info.length);
    combined.set(secret);
    combined.set(info, secret.length);
    const hash = sha256(combined);
    return hash.slice(0, length);
}
/**
 * Simple encrypt function that works in React Native
 * Uses XOR with derived key - for testing/demo only
 */
function simpleEncrypt(plaintext, key, sequence) {
    // Derive sequence-specific key
    const seqBytes = new Uint8Array(8);
    new DataView(seqBytes.buffer).setBigUint64(0, BigInt(sequence), false);
    const seqKey = deriveKey(key, seqBytes);
    // XOR encrypt
    const encrypted = xorEncrypt(plaintext, seqKey);
    // Prepend sequence number for decryption
    const result = new Uint8Array(4 + encrypted.length);
    new DataView(result.buffer).setUint32(0, sequence, false);
    result.set(encrypted, 4);
    return result;
}
/**
 * Simple decrypt function that works in React Native
 */
function simpleDecrypt(ciphertext, key) {
    if (ciphertext.length < 5)
        return null;
    // Extract sequence
    const sequence = new DataView(ciphertext.buffer, ciphertext.byteOffset).getUint32(0, false);
    const encrypted = ciphertext.slice(4);
    // Derive sequence-specific key
    const seqBytes = new Uint8Array(8);
    new DataView(seqBytes.buffer).setBigUint64(0, BigInt(sequence), false);
    const seqKey = deriveKey(key, seqBytes);
    // XOR decrypt
    const plaintext = xorDecrypt(encrypted, seqKey);
    return { plaintext, sequence };
}
exports.default = {
    sha256,
    sha512,
    deriveKey,
    simpleEncrypt,
    simpleDecrypt,
    bytesToHex,
    xorEncrypt,
    xorDecrypt,
};
