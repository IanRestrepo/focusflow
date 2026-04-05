#!/bin/bash
# Start PocketBase backend
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [ ! -f "./pocketbase" ]; then
  echo "PocketBase binary not found. Download from https://pocketbase.io/docs/"
  echo "Place the binary at: backend/pocketbase"
  exit 1
fi

chmod +x ./pocketbase
./pocketbase serve --http="127.0.0.1:8091" --dir="./pb_data"
