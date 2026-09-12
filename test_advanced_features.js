/**
 * WyreSup Advanced Features Test Suite
 * 
 * Tests:
 * 1. Encrypted File Transfer (TAKHIR chunking + SHA-256 verification)
 * 2. Multi-Hop Mesh Gossip Group Chat (Ishaa'ah routing through intermediate nodes)
 * 3. Follower-Hosted Distributed Social Feed (Nashr post signing & offline retrieval from followers)
 * 4. Real-time Sawt Voice Note Streaming (ISTI_JAL priority + waveform synthesis)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NodeP2PClient = require('./NodeP2PClient');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log(' WyreSup Advanced Protocol Features Test Suite');
console.log(' مَلَفَّات • جَمَاعَة • نَشْر • صَوْت');
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
// TEST 1: Encrypted File Transfer (نَقْل المَلَفَّات)
// ══════════════════════════════════════════════════════════════════════
async function testFileTransfer() {
    console.log('[TEST 1] Encrypted File Transfer (TAKHIR Chunking)');

    const downloadDir = path.join(__dirname, 'test_downloads');
    const alice = new NodeP2PClient({ name: 'Alice_FT', tcpPort: 6301 });
    const bob = new NodeP2PClient({ name: 'Bob_FT', tcpPort: 6302, fileOptions: { downloadDir } });

    await alice.init();
    await bob.init();

    // Create 64KB dummy test file
    const testFilePath = path.join(__dirname, 'test_sample_64kb.dat');
    const fileData = Buffer.concat([
        Buffer.from('WyreSup Encrypted Transfer Header - السلام عليكم\n'),
        crypto.randomBytes(65536)
    ]);
    fs.writeFileSync(testFilePath, fileData);
    const originalSha = crypto.createHash('sha256').update(fileData).digest('hex');

    // Connect Bob to Alice
    await bob.connectTcp('127.0.0.1', 6301);
    await sleep(200);

    let receivedFileEvent = null;
    bob.on('file_received', (ev) => {
        receivedFileEvent = ev;
    });

    console.log('  → Alice sending 64KB file to Bob in chunks...');
    const meta = await alice.sendFile(bob.identity.fullId, testFilePath);
    assert(meta.totalChunks > 1, `File split into ${meta.totalChunks} chunks`);

    // Wait for all chunks to transmit and verify
    await sleep(400);

    assert(receivedFileEvent !== null, 'Bob received and finalized file transfer');
    assert(receivedFileEvent.fileName === 'test_sample_64kb.dat', 'File name preserved');
    assert(receivedFileEvent.sha256 === originalSha, 'File SHA-256 checksum perfectly verified');
    assert(fs.existsSync(receivedFileEvent.savedPath), 'File written to download directory');

    // Cleanup test files
    try {
        fs.unlinkSync(testFilePath);
        fs.unlinkSync(receivedFileEvent.savedPath);
        fs.rmdirSync(downloadDir);
    } catch (e) {}

    await alice.close();
    await bob.close();
    console.log('  ✓ File Transfer suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// TEST 2: Multi-Hop Mesh Gossip Group Chat (جَمَاعَة و إِشَاعَة)
// ══════════════════════════════════════════════════════════════════════
async function testMeshGroupChat() {
    console.log('[TEST 2] Multi-Hop Mesh Gossip Group Chat (Alice ↔ Bob ↔ Charlie)');

    // Linear chain: Alice (6311) <-> Bob (6312) <-> Charlie (6313)
    const alice = new NodeP2PClient({ name: 'Alice_G', tcpPort: 6311 });
    const bob = new NodeP2PClient({ name: 'Bob_G', tcpPort: 6312 });
    const charlie = new NodeP2PClient({ name: 'Charlie_G', tcpPort: 6313 });

    await alice.init();
    await bob.init();
    await charlie.init();

    // Alice connects to Bob
    await alice.connectTcp('127.0.0.1', 6312);
    await sleep(150);

    // Charlie connects to Bob
    await charlie.connectTcp('127.0.0.1', 6312);
    await sleep(150);

    // Alice creates group
    const group = alice.createGroup('Majlis Mesh');
    bob.joinGroup(group.id, 'Majlis Mesh');
    charlie.joinGroup(group.id, 'Majlis Mesh');

    let charlieReceivedGroupMsg = null;
    charlie.on('group_message', (msg) => {
        charlieReceivedGroupMsg = msg;
    });

    let aliceReceivedGroupMsg = null;
    alice.on('group_message', (msg) => {
        aliceReceivedGroupMsg = msg;
    });

    // Alice sends message to group -> hops through Bob to Charlie
    console.log('  → Alice sending group message across mesh to Charlie (via Bob)...');
    const msgText = 'Hello Charlie! This message hopped across Bob.';
    await alice.sendGroupMessage(group.id, msgText);
    await sleep(250);

    assert(charlieReceivedGroupMsg !== null, 'Charlie received message via mesh gossip');
    assert(charlieReceivedGroupMsg.content === msgText, 'Charlie received accurate content');
    assert(charlieReceivedGroupMsg.hops === 2, 'Message traversed 2 hops across mesh');

    // Charlie replies back to group -> hops through Bob to Alice
    console.log('  → Charlie replying to group across mesh back to Alice...');
    const replyText = 'Hello Alice! 2-hop mesh reply confirmed.';
    await charlie.sendGroupMessage(group.id, replyText);
    await sleep(250);

    assert(aliceReceivedGroupMsg !== null, 'Alice received reply from Charlie via Bob');
    assert(aliceReceivedGroupMsg.content === replyText, 'Alice received accurate reply content');

    await alice.close();
    await bob.close();
    await charlie.close();
    console.log('  ✓ Mesh Group Chat suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// TEST 3: Follower-Hosted Distributed Social Feed (نَشْر و اتِّبَاع)
// ══════════════════════════════════════════════════════════════════════
async function testNashrSocialFeed() {
    console.log('[TEST 3] Follower-Hosted Distributed Social Feed (نَشْر)');

    const alice = new NodeP2PClient({ name: 'Alice_Nashr', tcpPort: 6321 });
    const bob = new NodeP2PClient({ name: 'Bob_Follower', tcpPort: 6322 });
    const charlie = new NodeP2PClient({ name: 'Charlie_Reader', tcpPort: 6323 });

    await alice.init();
    await bob.init();
    await charlie.init();

    // Bob connects to Alice and follows her
    await bob.connectTcp('127.0.0.1', 6321);
    await sleep(150);

    await bob.follow(alice.identity.fullId);
    await sleep(100);
    assert(alice.nashr.followers.has(bob.identity.fullId), 'Alice registered Bob as a follower');

    // Alice publishes signed post
    console.log('  → Alice publishing cryptographically signed post...');
    const postContent = 'Decentralized thought of the day: No central servers needed! #WyreSup';
    const publishedPost = await alice.publishPost(postContent);
    await sleep(200);

    // Bob should have received and cached Alice's post
    const bobTimeline = bob.getTimeline(alice.identity.fullId);
    assert(bobTimeline.length > 0, 'Bob cached Alice post as a follower (Hafiz)');
    assert(bobTimeline[0].content === postContent, 'Cached post matches content');

    // Alice shuts down / goes offline
    console.log('  → Alice goes OFFLINE...');
    await alice.close();
    await sleep(100);

    // Charlie connects to Bob (the follower/seeder) and queries Alice's feed
    console.log('  → Charlie queries Alice feed directly from Bob (the follower)...');
    await charlie.connectTcp('127.0.0.1', 6322);
    await sleep(150);

    let charlieFeedReceived = null;
    charlie.on('feed_received', (ev) => {
        charlieFeedReceived = ev;
    });

    await charlie.queryFeed(alice.identity.fullId);
    await sleep(250);

    assert(charlieFeedReceived !== null, 'Charlie received Alice feed from Bob');
    assert(charlieFeedReceived.posts.length > 0, 'Charlie retrieved Alice posts from follower');
    assert(charlieFeedReceived.posts[0].content === postContent, 'Retrieved post content accurate');
    assert(charlieFeedReceived.seededBy === bob.identity.fullId, 'Confirmed seeded by Bob');

    await bob.close();
    await charlie.close();
    console.log('  ✓ Follower-Hosted Nashr Feed suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// TEST 4: Real-time Sawt Voice Note Streaming (صَوْت)
// ══════════════════════════════════════════════════════════════════════
async function testSawtVoiceNotes() {
    console.log('[TEST 4] Real-time Sawt Voice Note Streaming (صَوْت)');

    const alice = new NodeP2PClient({ name: 'Alice_Sawt', tcpPort: 6331 });
    const bob = new NodeP2PClient({ name: 'Bob_Sawt', tcpPort: 6332 });

    await alice.init();
    await bob.init();

    await bob.connectTcp('127.0.0.1', 6331);
    await sleep(150);

    let voiceNoteReceived = null;
    bob.on('voice_received', (ev) => {
        voiceNoteReceived = ev;
    });

    console.log('  → Alice sending 5s voice note to Bob (Urgent Priority 1 / ISTI_JAL)...');
    await alice.sendVoiceNote(bob.identity.fullId, 5, 'Meeting audio summary');
    await sleep(200);

    assert(voiceNoteReceived !== null, 'Bob received voice note packet');
    assert(voiceNoteReceived.duration === 5, 'Voice note duration is 5 seconds');
    assert(voiceNoteReceived.caption === 'Meeting audio summary', 'Caption matches');
    assert(voiceNoteReceived.visualWaveform.length > 0, `Waveform rendered: ${voiceNoteReceived.visualWaveform}`);

    await alice.close();
    await bob.close();
    console.log('  ✓ Sawt Voice Note suite PASSED\n');
}

// ══════════════════════════════════════════════════════════════════════
// Main Runner
// ══════════════════════════════════════════════════════════════════════
async function runAll() {
    try {
        await testFileTransfer();
        await testMeshGroupChat();
        await testNashrSocialFeed();
        await testSawtVoiceNotes();

        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log(` ALL ADVANCED PROTOCOL TESTS PASSED: ${passedTests}/${totalTests} checks verified!`);
        console.log(' Modules: ✓ FileTransfer  ✓ MeshGossip  ✓ NashrFeed  ✓ SawtVoice');
        console.log('═══════════════════════════════════════════════════════════════════════\n');
        process.exit(0);
    } catch (err) {
        console.error('\nTest suite failed:', err);
        process.exit(1);
    }
}

runAll();
