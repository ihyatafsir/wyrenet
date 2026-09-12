# WyreNet - Sovereign L1 Mesh Messenger & Crypto Wallet

WyreNet is a decentralized, sovereign peer-to-peer messaging and Web3 crypto wallet application built for Android (Target SDK 36, Android 16) and cross-platform mesh environments. It operates completely independently of centralized domain names, relying on direct P2P transports and on-chain Avalanche Subnet anchors.

## Key Capabilities

### 1. Embedded Sovereign Crypto Wallet
- BIP-39 mnemonic phrase generation and seed derivation (12 words).
- secp256k1 key derivation and Keccak-256 Ethereum-compatible address formatting.
- Local on-device cryptographic signing with zero third-party wallet dependency.
- Dual-network JSON-RPC integration:
  - WyreNet Sovereign L1 Subnet (ChainID 51950, Currency: ZBAT)
  - Avalanche Fuji Testnet C-Chain (ChainID 43113, Currency: AVAX)
- DID Identity Anchoring (did:wyre:<address>).

### 2. Zero-Domain Decentralized Mesh Network
- Direct peer-to-peer message routing via local mesh, WebRTC, and WebSocket relays.
- Full cryptographic isolation with zero reliance on central DNS/domains.
- Lisan al-Arab lexical cryptographic primitives and 13-layer protocol stack.

### 3. Protocol Architecture
- ZBAT: Zero-Byte Autonomous Transport for high-efficiency packet delivery.
- Miftah: Asymmetric identity key exchange and session ratchet.
- Nafaq: Encrypted P2P IP tunneling.
- Nagham: Acoustic DTMF out-of-band key verification.
- Sawt: Opus-compressed direct voice messaging.
- Barq: Flash synchronization and presence verification.

## Build and Installation

### Prerequisites
- Node.js >= 18
- OpenJDK 17
- Android SDK (API Level 36 / Android 16)
- React Native 0.74+

### Android Release Build
```sh
cd android
./gradlew assembleRelease
```
The compiled APK will be output to:
`android/app/build/outputs/apk/release/app-release.apk`

## License
Proprietary and Confidential - WyreNet Autonomous Mesh Protocol.
