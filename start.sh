#!/bin/sh
set -e

export HOST=0.0.0.0
export PORT="${PORT:-9000}"

echo "Starting Medusa server..."
yarn start
