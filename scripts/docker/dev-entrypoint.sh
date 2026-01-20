#!/bin/bash
# =============================================================================
# Development Entrypoint Script
# =============================================================================
#
# Symlinks the mounted busibox-app into node_modules for hot reload.
# busibox-app is mounted at /app/.busibox-app (inside project dir for Turbopack)
#
# =============================================================================

set -e

echo "========================================"
echo "Development Entrypoint"
echo "========================================"

# Check if busibox-app is mounted
BUSIBOX_MOUNT="/app/.busibox-app"
if [ -d "$BUSIBOX_MOUNT" ] && [ -f "$BUSIBOX_MOUNT/package.json" ]; then
    echo "[1/3] Found busibox-app at $BUSIBOX_MOUNT"
    
    # Check for dist
    if [ ! -d "$BUSIBOX_MOUNT/dist" ]; then
        echo ""
        echo "ERROR: $BUSIBOX_MOUNT/dist not found!"
        echo "Please build busibox-app on your host machine first:"
        echo "  cd ../busibox-app && npm run build"
        echo ""
        exit 1
    fi
    echo "[2/3] busibox-app dist found"
    
    # Symlink into node_modules
    echo "[3/3] Symlinking busibox-app into node_modules..."
    mkdir -p /app/node_modules/@jazzmind
    rm -rf /app/node_modules/@jazzmind/busibox-app
    ln -s /app/.busibox-app /app/node_modules/@jazzmind/busibox-app
    echo "✓ Symlinked: node_modules/@jazzmind/busibox-app -> /app/.busibox-app"
else
    echo "[1/1] Using npm-installed busibox-app"
fi

echo ""
echo "========================================"
echo "Starting development server..."
echo "========================================"
echo ""

exec "$@"
