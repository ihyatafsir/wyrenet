#!/bin/bash
set -e

echo "================================================================="
echo "WYRENET SOVEREIGN MAINNET L1 SUBNET DEPLOYMENT SCRIPT"
echo "Chain ID: 51950 | Token: WYRE (18 decimals) | Protocol: ZBAT/EVM"
echo "================================================================="

GENESIS_FILE="$(pwd)/genesis.json"
SUBNET_CONFIG_DIR="$HOME/.wyrenet-l1"

if [ ! -f "$GENESIS_FILE" ]; then
  echo "Generating genesis.json..."
  node scripts/generate_wyrenet_l1_genesis.js
fi

mkdir -p "$SUBNET_CONFIG_DIR/data"
mkdir -p "$SUBNET_CONFIG_DIR/keystore"

echo "Configuring Subnet-EVM parameters..."
cat << 'SUBCONFIG' > "$SUBNET_CONFIG_DIR/config.json"
{
  "continuous-profiler-dir": "",
  "continuous-profiler-frequency": 900000000000,
  "continuous-profiler-max-files": 5,
  "log-level": "info",
  "pruning-enabled": true,
  "tx-lookup-limit": 0
}
SUBCONFIG

echo "WyreNet Mainnet L1 Subnet parameters configured:"
echo "- Genesis Path: $GENESIS_FILE"
echo "- Node Data Path: $SUBNET_CONFIG_DIR/data"
echo "- Target RPC Endpoint: http://127.0.0.1:9650/ext/bc/51950/rpc"
echo "- Gasless Relayer Sponsor: 0x519500000000000000000000000000000000f08d"
echo "================================================================="
echo "Ready for AvalancheGo Subnet-EVM node activation."
