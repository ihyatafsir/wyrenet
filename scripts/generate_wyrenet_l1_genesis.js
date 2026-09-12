#!/usr/bin/env node
/**
 * scripts/generate_wyrenet_l1_genesis.js
 * Deterministic Genesis Specification Generator for WyreNet Mainnet L1 Subnet
 * Avalanche Subnet-EVM (ChainID: 51950, Native Token: WYRE)
 */

const fs = require('fs');
const path = require('path');

const CHAIN_ID = 51950;
const TOKEN_SYMBOL = 'WYRE';
const ADMIN_ADDRESS = '0x471c852d254a67f36c129f2386ca21c31840dea4';
const FORWARDER_ADDRESS = '0x519500000000000000000000000000000000f08d';

function generateGenesis() {
  const genesis = {
    config: {
      chainId: CHAIN_ID,
      homesteadBlock: 0,
      eip150Block: 0,
      eip150Hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      berlinBlock: 0,
      londonBlock: 0,
      clique: {
        period: 2,
        epoch: 30000
      },
      feeConfig: {
        gasLimit: 15000000,
        targetBlockRate: 2,
        minBaseFee: 25000000000, // 25 gwei min base fee
        targetGas: 15000000,
        baseFeeChangeDenominator: 36,
        minBlockGasCost: 0,
        maxBlockGasCost: 10000000,
        blockGasCostStep: 200000
      },
      contractNativeMinterConfig: {
        blockTimestamp: 0,
        adminAddresses: [ADMIN_ADDRESS]
      },
      contractDeployerAllowListConfig: {
        blockTimestamp: 0,
        adminAddresses: [ADMIN_ADDRESS]
      }
    },
    alloc: {
      // Admin / Treasury: 1,000,000,000 WYRE (1e27 wei)
      [ADMIN_ADDRESS.replace(/^0x/, '').toLowerCase()]: {
        balance: "0x33b2e3c9fd0803ce8000000"
      },
      // Gasless Forwarder Pre-fund: 100,000,000 WYRE
      [FORWARDER_ADDRESS.replace(/^0x/, '').toLowerCase()]: {
        balance: "0x52b7d2dcc80cd2e4000000"
      }
    },
    nonce: "0x0",
    timestamp: "0x66e35560",
    extraData: "0x0000000000000000000000000000000000000000000000000000000000000000" + ADMIN_ADDRESS.replace(/^0x/, '') + "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: "0xe4e1c0",
    difficulty: "0x1",
    mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    coinbase: "0x0000000000000000000000000000000000000000",
    number: "0x0",
    gasUsed: "0x0",
    parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
  };

  const outPath = path.join(__dirname, '../genesis.json');
  fs.writeFileSync(outPath, JSON.stringify(genesis, null, 2), 'utf8');
  console.log(`[WyreNet L1] Mainnet Genesis generated at ${outPath}`);
  console.log(`[WyreNet L1] ChainID: ${CHAIN_ID} | Token: ${TOKEN_SYMBOL} | Target Gas: 15,000,000 | Block Time: 2s`);
}

generateGenesis();
