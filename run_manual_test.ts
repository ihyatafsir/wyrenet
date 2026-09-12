import { maladhDiscovery } from './src/network/MaladhDiscovery';
import { shabahStego } from './src/network/ShabahStego';
maladhDiscovery.activate();
maladhDiscovery.toggleMethod('qina', true);
maladhDiscovery.toggleMethod('dalil', true);

// Create fake beacon
const beacon = {
    peerId: 'peer_' + Math.random().toString(36).substr(2, 8),
    publicKey: 'abcdef1234567890abcdef12345678901',
    endpoints: [{ type: 'tcp', host: '192.168.1.100', port: 9000, priority: 1 }],
    timestamp: Date.now(),
    ttl: 300,
    nonce: '1234567890abcdef',
    signature: ''
};

const probe = maladhDiscovery.qinaCreateProbe(beacon as any);
console.log('Qina Probe Url:', probe.url);
const exQina = maladhDiscovery.qinaExtractProbe(probe.url, probe.headers);
console.log('Qina Extracted match?', exQina?.peerId === beacon.peerId);
console.log('Qina Extracted:', exQina);

const stegoText = maladhDiscovery.dalilPublish(beacon as any, 'Hello world');
const exDalil = maladhDiscovery.dalilExtract(stegoText);
console.log('Dalil Extracted match?', exDalil?.peerId === beacon.peerId);
console.log('Dalil Extracted:', exDalil);
