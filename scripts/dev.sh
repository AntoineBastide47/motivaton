#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

backend_pid=""
miniapp_pid=""

cleanup() {
  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$miniapp_pid" ]] && kill -0 "$miniapp_pid" 2>/dev/null; then
    kill "$miniapp_pid" 2>/dev/null || true
  fi

  if [[ -n "$backend_pid" ]]; then
    wait "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$miniapp_pid" ]]; then
    wait "$miniapp_pid" 2>/dev/null || true
  fi
}

handle_signal() {
  cleanup
  exit 130
}

trap handle_signal INT TERM
trap cleanup EXIT

echo "Starting backend and miniapp..."

pnpm --filter motivaton-backend dev &
backend_pid=$!

pnpm --filter motivaton-miniapp dev &
miniapp_pid=$!

status=0

# Exit when either child process stops so the remaining one can be cleaned up.
while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$miniapp_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  wait "$backend_pid" || status=$?
fi

if ! kill -0 "$miniapp_pid" 2>/dev/null; then
  wait "$miniapp_pid" || status=$?
fi

exit "$status"
