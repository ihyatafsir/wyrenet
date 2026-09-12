#!/bin/bash
set -e

echo "Packaging WyreNet for Serverless & Standalone Zero-Domain Deployment..."
OUTPUT_TAR="wyrenet-serverless-deploy.tar.gz"

tar -czf "$OUTPUT_TAR" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="android" \
  --exclude="ios" \
  --exclude="*.apk" \
  --exclude=".gradle" \
  --exclude="build" \
  index.html \
  p2p-client.html \
  style.css \
  wyrenet_runtime.js \
  app.js \
  wyrenet-server.js \
  api \
  public \
  vercel.json \
  netlify.toml \
  _headers \
  package.json

ls -lh "$OUTPUT_TAR"
echo "Serverless bundle created successfully."
