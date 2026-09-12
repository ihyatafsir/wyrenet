"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MaladhDiscovery_1 = require("./src/network/MaladhDiscovery");
MaladhDiscovery_1.maladhDiscovery.activate();
MaladhDiscovery_1.maladhDiscovery.toggleMethod('qina', true);
MaladhDiscovery_1.maladhDiscovery.toggleMethod('dalil', true);
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
const probe = MaladhDiscovery_1.maladhDiscovery.qinaCreateProbe(beacon);
console.log('Qina Probe Url:', probe.url);
const exQina = MaladhDiscovery_1.maladhDiscovery.qinaExtractProbe(probe.url, probe.headers);
console.log('Qina Extracted match?', (exQina === null || exQina === void 0 ? void 0 : exQina.peerId) === beacon.peerId);
console.log('Qina Extracted:', exQina);
const stegoText = MaladhDiscovery_1.maladhDiscovery.dalilPublish(beacon, 'Hello world');
const exDalil = MaladhDiscovery_1.maladhDiscovery.dalilExtract(stegoText);
console.log('Dalil Extracted match?', (exDalil === null || exDalil === void 0 ? void 0 : exDalil.peerId) === beacon.peerId);
console.log('Dalil Extracted:', exDalil);
