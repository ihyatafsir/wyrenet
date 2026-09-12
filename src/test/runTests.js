"use strict";
/**
 * Standalone Node.js Test Runner for 5G Lite Protocol
 * Run with: npx ts-node src/test/runTests.ts
 *
 * Tests protocol functions without needing React Native
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Polyfill crypto for Node.js
const crypto_1 = require("crypto");
if (!globalThis.crypto) {
    globalThis.crypto = crypto_1.webcrypto;
}
// Polyfill Buffer if needed
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}
console.log('═══════════════════════════════════════════════════════');
console.log(' 5G Lite Protocol Test Suite');
console.log(' خَامِس الجِيل الخَفِيف - اختبار');
console.log('═══════════════════════════════════════════════════════\n');
const results = [];
async function test(name, fn) {
    const start = Date.now();
    try {
        await fn();
        results.push({ name, passed: true, duration: Date.now() - start });
        console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
    }
    catch (e) {
        results.push({ name, passed: false, duration: Date.now() - start, error: e.message });
        console.log(`  ✗ ${name} - ${e.message}`);
    }
}
function assert(condition, msg) {
    if (!condition)
        throw new Error(msg);
}
// ═══════════════════════════════════════════════════════════════════
// Test Suites
// ═══════════════════════════════════════════════════════════════════
async function testMiftah() {
    console.log('\n[MIFTAH] مِفْتَاح - Puncturable Encryption Tests\n');
    // Import dynamically to handle any module issues
    const Miftah = await Promise.resolve().then(() => __importStar(require('../network/MiftahEncryption')));
    await test('Create key (فَتَحَ)', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        const key = await Miftah.fataha('test@peer', privateKey, publicKey);
        assert(key !== null, 'Key creation failed');
        assert(key.peerId === 'test@peer', 'Wrong peer ID');
        Miftah.aghlaqa('test@peer');
    });
    await test('Encrypt message (تَشْفِير)', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        await Miftah.fataha('encrypt@test', privateKey, publicKey);
        const result = await Miftah.tashfir('encrypt@test', 'السلام عليكم');
        assert(result !== null, 'Encryption failed');
        assert(result.encrypted.length > 0, 'Empty ciphertext');
        assert(result.sequence === 0, 'Wrong sequence');
        Miftah.aghlaqa('encrypt@test');
    });
    await test('Decrypt message (فَكّ)', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        await Miftah.fataha('decrypt@test', privateKey, publicKey);
        const encrypted = await Miftah.tashfir('decrypt@test', 'Test message');
        const decrypted = await Miftah.fakk('decrypt@test', encrypted.encrypted);
        assert(decrypted === 'Test message', `Wrong decryption: ${decrypted}`);
        Miftah.aghlaqa('decrypt@test');
    });
    await test('Replay protection (ثَقْب)', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        await Miftah.fataha('replay@test', privateKey, publicKey);
        const encrypted = await Miftah.tashfir('replay@test', 'Replay test');
        // First decrypt should work
        const first = await Miftah.fakk('replay@test', encrypted.encrypted);
        assert(first === 'Replay test', 'First decrypt failed');
        // Second decrypt (replay) should fail
        const replay = await Miftah.fakk('replay@test', encrypted.encrypted);
        assert(replay === null, 'Replay attack succeeded - SECURITY ISSUE!');
        Miftah.aghlaqa('replay@test');
    });
}
async function testBarq() {
    console.log('\n[BARQ] بَرْق - Lightning Protocol Tests\n');
    const Barq = await Promise.resolve().then(() => __importStar(require('../network/BarqProtocol')));
    await test('0-RTT Connection', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        const conn = await Barq.createConnection(privateKey, 'barq@test', publicKey);
        assert(conn !== null, 'Connection failed');
        assert(conn.peerId === 'barq@test', 'Wrong peer ID');
        Barq.closeConnection('barq@test');
    });
    await test('Create data packet', async () => {
        const privateKey = new Uint8Array(32);
        crypto.getRandomValues(privateKey);
        const publicKey = new Uint8Array(32);
        crypto.getRandomValues(publicKey);
        await Barq.createConnection(privateKey, 'packet@test', publicKey);
        const packet = await Barq.createDataPacket('packet@test', 'Hello Barq');
        assert(packet !== null, 'Packet creation failed');
        assert(packet.length > 16, 'Packet too small');
        Barq.closeConnection('packet@test');
    });
}
async function testNabd() {
    console.log('\n[NABD] نَبْض - Pulse Timing Tests\n');
    const Nabd = await Promise.resolve().then(() => __importStar(require('../network/NabdTiming')));
    await test('Gap detection', async () => {
        Nabd.initTiming('nabd@test');
        // Receive 0, 1, skip 2, receive 3
        Nabd.onReceive('nabd@test', 0);
        Nabd.onReceive('nabd@test', 1);
        const gaps = Nabd.onReceive('nabd@test', 3);
        assert(gaps.includes(2), 'Gap at sequence 2 not detected');
        Nabd.cleanup('nabd@test');
    });
    await test('Health check', async () => {
        Nabd.initTiming('health@test');
        Nabd.onReceive('health@test', 0);
        const healthy = Nabd.isHealthy('health@test');
        assert(healthy === true, 'Should be healthy after receive');
        Nabd.cleanup('health@test');
    });
}
async function testSayl() {
    console.log('\n[SAYL] سَيْل - Flow Control Tests\n');
    const Sayl = await Promise.resolve().then(() => __importStar(require('../network/SaylFlow')));
    await test('Initial window', async () => {
        Sayl.initFlow('sayl@test');
        const canSend = Sayl.canSend('sayl@test');
        assert(canSend === true, 'Should allow sending initially');
        Sayl.cleanup('sayl@test');
    });
    await test('Congestion response', async () => {
        Sayl.initFlow('cong@test');
        // Get initial stats
        const beforeCwnd = Sayl.getStats('cong@test').congestionWindow;
        // Simulate loss
        Sayl.onLoss('cong@test');
        const afterCwnd = Sayl.getStats('cong@test').congestionWindow;
        assert(afterCwnd < beforeCwnd, 'Window should decrease on loss');
        Sayl.cleanup('cong@test');
    });
}
// ═══════════════════════════════════════════════════════════════════
// Run all tests
// ═══════════════════════════════════════════════════════════════════
async function main() {
    try {
        await testMiftah();
        await testBarq();
        await testNabd();
        await testSayl();
    }
    catch (e) {
        console.error('\nFatal error:', e.message);
    }
    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(` Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════\n');
    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
        process.exit(1);
    }
}
main();
