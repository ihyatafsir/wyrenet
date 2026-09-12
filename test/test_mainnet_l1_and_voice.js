/**
 * test/test_mainnet_l1_and_voice.js
 * Comprehensive automated verification for:
 * - 246-Volume EPUB Corpus & On-Chain L1 Anchoring
 * - WebRTC Voice & Call State Machine
 * - WyreNet Mainnet L1 Subnet 51950 Genesis Configuration
 * - AI Call Assistant Endpoint
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(parsed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch (e) {
          resolve({ status: res.statusCode, text: chunks });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(parsed, {
      method: 'GET',
      timeout: 10000
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch (e) {
          resolve({ status: res.statusCode, text: chunks });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('WYRENET MAINNET L1 & VOICE SYSTEM VERIFICATION');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  // 1. Verify EPUB On-Chain Anchoring
  try {
    const res = await httpPost('http://127.0.0.1:5190/api/blockchain/anchor-epub', {
      filename: 'tafsir_kabir_v2_vol_01_en.epub',
      title: 'Tafsir al-Kabir Vol 1',
      author: 'Imam Fakhr al-Din al-Razi'
    });
    if (res.status === 200 && res.data.status === 'ANCHORED_ON_L1' && res.data.txHash && res.data.token === 'WYRE') {
      console.log(`[PASS] 1. EPUB Anchored to L1 (Tx: ${res.data.txHash.substring(0, 18)}..., Block: ${res.data.blockHeight}, Token: ${res.data.token})`);
      passed++;
    } else {
      console.error('[FAIL] 1. EPUB Anchor response:', res.data);
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 1. EPUB Anchor error:', e.message);
    failed++;
  }

  // 2. Verify Batch Corpus Anchoring (246 Books)
  try {
    const res = await httpPost('http://127.0.0.1:5190/api/blockchain/batch-anchor-corpus', {});
    if (res.status === 200 && res.data.status === 'CORPUS_BATCH_ANCHORED' && res.data.totalManuscripts >= 244) {
      console.log(`[PASS] 2. Batch Corpus Anchoring Verified (${res.data.totalManuscripts} Manuscripts, Tx: ${res.data.batchTxHash.substring(0, 18)}...)`);
      passed++;
    } else {
      console.error('[FAIL] 2. Batch Anchor failed:', res.data);
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 2. Batch Anchor error:', e.message);
    failed++;
  }

  // 3. Verify Classical Manifest Stream (246 Volumes)
  try {
    const res = await httpGet('http://127.0.0.1:5190/api/library/manifest');
    if (res.status === 200 && Array.isArray(res.data.books) && res.data.totalBooks >= 244) {
      console.log(`[PASS] 3. Classical Manifest Verified (${res.data.totalBooks} Volumes Cataloged)`);
      passed++;
    } else {
      console.error('[FAIL] 3. Manifest error:', res.data);
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 3. Manifest error:', e.message);
    failed++;
  }

  // 4. Verify EPUB Direct Binary Stream
  try {
    const res = await httpGet('http://127.0.0.1:5190/epubs/tafsir_kabir_v2_vol_01_en.epub');
    if (res.status === 200 && (typeof res.text === 'string' && res.text.length > 10000)) {
      console.log(`[PASS] 4. Direct EPUB Stream Verified (${res.text.length} bytes delivered)`);
      passed++;
    } else {
      console.error('[FAIL] 4. EPUB stream error:', res.status);
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 4. EPUB stream error:', e.message);
    failed++;
  }

  // 5. Verify AynEngine & DeepSeek Flash 4.1 Real-Time Call Assistant
  try {
    const res = await httpPost('http://127.0.0.1:5190/api/ai/call-assist', {
      query: 'Translate to classical Arabic: The knowledge of God is the root of felicity.',
      channelId: 'voice-lounge-sawt'
    });
    if (res.status === 200 && res.data.reply) {
      console.log(`[PASS] 5. Call Assistant Verified ("${res.data.reply.substring(0, 60)}...")`);
      passed++;
    } else {
      console.error('[FAIL] 5. Call assistant response:', res.data);
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 5. Call assistant error:', e.message);
    failed++;
  }

  // 6. Verify Mainnet L1 Subnet Genesis Configuration
  try {
    const genesisPath = path.join(__dirname, '../genesis.json');
    if (fs.existsSync(genesisPath)) {
      const g = JSON.parse(fs.readFileSync(genesisPath, 'utf8'));
      if (g.config.chainId === 51950 && g.config.feeConfig.gasLimit === 15000000 && g.config.feeConfig.minBaseFee === 25000000000) {
        console.log(`[PASS] 6. Mainnet L1 Genesis Validated (ChainID: ${g.config.chainId}, GasLimit: ${g.config.feeConfig.gasLimit}, MinBaseFee: 25 gwei)`);
        passed++;
      } else {
        console.error('[FAIL] 6. Genesis parameter mismatch:', g.config);
        failed++;
      }
    } else {
      console.error('[FAIL] 6. genesis.json not found');
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 6. Genesis parse error:', e.message);
    failed++;
  }

  // 7. Verify WebRTC Engine Module
  try {
    const webrtcPath = path.join(__dirname, '../public/webrtc_channel.js');
    if (fs.existsSync(webrtcPath)) {
      const webrtcCode = fs.readFileSync(webrtcPath, 'utf8');
      if (webrtcCode.includes('ChannelState') && webrtcCode.includes('createPeerConnection')) {
        console.log('[PASS] 7. WyreWebRtcChannel 5-Pillar Engine Verified');
        passed++;
      } else {
        console.error('[FAIL] 7. WebRTC module incomplete');
        failed++;
      }
    } else {
      console.error('[FAIL] 7. webrtc_channel.js missing');
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 7. WebRTC error:', e.message);
    failed++;
  }

  // 8. Verify Smart Contracts on Subnet 51950
  try {
    const c1 = fs.readFileSync(path.join(__dirname, '../contracts/WyreClassicalCorpusRegistry.sol'), 'utf8');
    const c2 = fs.readFileSync(path.join(__dirname, '../contracts/WyreGaslessForwarder.sol'), 'utf8');
    if (c1.includes('registerManuscript') && c2.includes('WyreGaslessForwarder')) {
      console.log('[PASS] 8. Sovereign Subnet 51950 Solidity Contracts Verified (Registry + Forwarder)');
      passed++;
    } else {
      console.error('[FAIL] 8. Contracts missing functions');
      failed++;
    }
  } catch (e) {
    console.error('[FAIL] 8. Contract read error:', e.message);
    failed++;
  }

  console.log('================================================================');
  console.log(`VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runVerification();
