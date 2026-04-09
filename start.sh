#!/bin/sh
set -e
export HOST=0.0.0.0
export PORT="${PORT:-9000}"

echo "Running migrations..."
yarn medusa db:migrate

echo "Starting Medusa server..."
yarn start
