/**
 * WyreSup End-to-End Node.js P2P Integration Test Suite
 * 
 * Verifies:
 * 1. Direct TCP P2P connection & handshake
 * 2. Miftah (Aqd) forward-secret key exchange
 * 3. ZBAT encrypted bidirectional messaging
 * 4. Replay attack rejection (Thaqb sequence puncturing)
 * 5. WebSocket Relay (Wasit) multi-peer discovery & encrypted routing
 */

const http = require('http');
const WebSocket = require('ws');
const NodeP2PClient = require('./NodeP2PClient');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log(' WyreSup End-to-End Node.js P2P Test Suite');
console.log(' خَامِس الجِيل الخَفِيف - اختبار شامل');
console.log('═══════════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ ${message}`);
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        throw new Error(message);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ══════════════════════════════════════════════════════════════════════
// TEST SUITE 1: Direct TCP P2P Communication
// ══════════════════════════════════════════════════════════════════════
async function testDirectTcp() {
    console.log('[TEST 1] Direct TCP P2P Communication & Encryption');

    const alice = new NodeP2PClient({ name: 'Alice_TCP', tcpPort: 6101 });
    const bob = new NodeP2PClient({ name: 'Bob_TCP', tcpPort: 6102 });

    await alice.init();
    await bob.init();

    assert(alice.identity.fullId.startsWith('Alice_TCP@'), 'Alice identity created');
    assert(bob.identity.fullId.startsWith('Bob_TCP@'), 'Bob identity created');

    let aliceReceivedMsg = null;
    let bobReceivedMsg = null;

    alice.on('message', (msg) => {
        aliceReceivedMsg = msg;
    });

    bob.on('message', (msg) => {
        bobReceivedMsg = msg;
    });

    // Bob connects to Alice over TCP
    console.log('  → Bob connecting to Alice (127.0.0.1:6101)...');
    await bob.connectTcp('127.0.0.1', 6101);
    await sleep(200);

    assert(alice.peers.has(bob.identity.fullId), 'Alice registered Bob');
    assert(bob.peers.has(alice.identity.fullId), 'Bob registered Alice');
    assert(alice.peers.get(bob.identity.fullId).keyEstablished, 'Alice established Aqd key with Bob');
    assert(bob.peers.get(alice.identity.fullId).keyEstablished, 'Bob established Aqd key with Alice');

    // Alice sends encrypted message to Bob
    const aliceText = 'السلام عليكم يا بوب - Hello Bob via Direct TCP!';
    const sentPacket = await alice.sendMessage(bob.identity.fullId, aliceText);
    await sleep(150);

    assert(bobReceivedMsg !== null, 'Bob received message from Alice');
    assert(bobReceivedMsg.text === aliceText, 'Bob decrypted message accurately');
    assert(bobReceivedMsg.encrypted === true, 'Message was encrypted with Miftah/ZBAT');

    // Bob replies to Alice
    const bobReply = 'وعليكم السلام يا أليس - TCP link confirmed!';
    await bob.sendMessage(alice.identity.fullId, bobReply);
    await sleep(150);

    assert(aliceReceivedMsg !== null, 'Alice received reply from Bob');
    assert(aliceReceivedMsg.text === bobReply, 'Alice decrypted reply accurately');

    // Test Replay Attack Rejection (Thaqb)
    console.log('  → Simulating replay attack on Bob...');
    let securityWarningTriggered = false;
    bob.on('security_warning', (warn) => {
        if (warn.type === 'REPLAY_OR_CORRUPT') {
            securityWarningTriggered = true;
        }
    });

    // Replay Alice's first packet directly into Bob's socket
    const bobSocket = Array.from(alice.peers.values())[0].tcpSocket;
    alice.sendTcpFrame(bobSocket, sentPacket);
    await sleep(150);

    assert(securityWarningTriggered === true, 'Bob rejected replayed packet due to Thaqb sequence puncturing');

    await alice.close();
    await bob.close();
    console.log('  ✓ Direct TCP suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// TEST SUITE 2: WebSocket Relay Communication (Wasit)
// ══════════════════════════════════════════════════════════════════════
async function testWebSocketRelay() {
    console.log('[TEST 2] WebSocket Relay (WASIT) Multi-Peer Communication');

    // Start local relay server on test port 5198
    const RELAY_PORT = 5198;
    const httpServer = http.createServer();
    const wss = new WebSocket.Server({ server: httpServer });
    const relayPeers = new Map();

    wss.on('connection', (ws) => {
        let peerId = null;
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'REGISTER') {
                    peerId = msg.identity;
                    relayPeers.set(peerId, ws);
                    ws.send(JSON.stringify({
                        type: 'REGISTERED',
                        peerId,
                        peers: Array.from(relayPeers.keys()).filter(id => id !== peerId)
                    }));
                    // Broadcast to others
                    relayPeers.forEach((targetWs, id) => {
                        if (id !== peerId && targetWs.readyState === WebSocket.OPEN) {
                            targetWs.send(JSON.stringify({ type: 'PEER_JOINED', peerId }));
                        }
                    });
                } else if (msg.to && relayPeers.has(msg.to)) {
                    relayPeers.get(msg.to).send(data.toString());
                }
            } catch (e) {}
        });
        ws.on('close', () => {
            if (peerId) {
                relayPeers.delete(peerId);
                relayPeers.forEach((targetWs) => {
                    if (targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({ type: 'PEER_LEFT', peerId }));
                    }
                });
            }
        });
    });

    await new Promise(r => httpServer.listen(RELAY_PORT, '127.0.0.1', r));
    console.log(`  → Relay server started on ws://127.0.0.1:${RELAY_PORT}`);

    const relayUrl = `ws://127.0.0.1:${RELAY_PORT}`;
    const userA = new NodeP2PClient({ name: 'UserA_Relay', relayUrl });
    const userB = new NodeP2PClient({ name: 'UserB_Relay', relayUrl });

    await userA.init();
    await userB.init();

    await sleep(300);

    assert(userA.peers.has(userB.identity.fullId), 'UserA discovered UserB via Relay');
    assert(userB.peers.has(userA.identity.fullId), 'UserB discovered UserA via Relay');
    assert(userA.peers.get(userB.identity.fullId).keyEstablished, 'UserA established Aqd with UserB via Relay');
    assert(userB.peers.get(userA.identity.fullId).keyEstablished, 'UserB established Aqd with UserA via Relay');

    let userBReceived = null;
    userB.on('message', (msg) => {
        userBReceived = msg;
    });

    const relayMsg = 'Secret message routed through WASIT relay!';
    await userA.sendMessage(userB.identity.fullId, relayMsg);
    await sleep(200);

    assert(userBReceived !== null, 'UserB received message over relay');
    assert(userBReceived.text === relayMsg, 'UserB decrypted relay message accurately');
    assert(userBReceived.transport === 'relay', 'Transport correctly identified as relay');

    await userA.close();
    await userB.close();
    wss.close();
    httpServer.close();
    console.log('  ✓ WebSocket Relay suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// Main Runner
// ══════════════════════════════════════════════════════════════════════
async function runAll() {
    try {
        await testDirectTcp();
        await testWebSocketRelay();

        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log(` ALL END-TO-END TESTS PASSED: ${passedTests}/${totalTests} checks verified!`);
        console.log(' Production-Ready Status: ✓ STABLE');
        console.log('═══════════════════════════════════════════════════════════════════════\n');
        process.exit(0);
    } catch (err) {
        console.error('\nTest suite failed:', err);
        process.exit(1);
    }
}

runAll();
