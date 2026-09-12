import { maladhDiscovery } from './src/network/MaladhDiscovery';
import { shabahStego } from './src/network/ShabahStego';
maladhDiscovery.activate();
maladhDiscovery.toggleMethod('dalil', true);

function createTestBeacon(suffix: string = '1') {
    return {
        peerId: `peer_${suffix}@wyresup.test`,
        publicKey: `abcdef1234567890abcdef1234567890${suffix}`,
        endpoints: [{ type: 'tcp', host: '192.168.1.100', port: 9000, priority: 1 }],
        timestamp: Date.now(),
        ttl: 300,
        nonce: '1234567890abcdef',
        signature: ''
    };
}

const beacon = createTestBeacon('dalil');
const coverText = 'Just had the best coffee this morning! ☕ Nothing beats a fresh brew to start the day. #MondayMotivation';
const compact = JSON.stringify({
    i: beacon.peerId,
    k: beacon.publicKey.slice(0, 32),
    e: beacon.endpoints[0],
    n: beacon.nonce,
});
console.log('original compact obj size:', compact.length, compact);

const result = shabahStego.hideInText(coverText, compact);
const stegoText = result.stegoData as string;
const extracted = maladhDiscovery.dalilExtract(stegoText);

console.log('--- Dalil Info ---');
console.log('Extracted:', extracted);
