#!/bin/bash
# =============================================================================
# Development Entrypoint Script
# =============================================================================
#
# Handles npm link for busibox-app and starts the development server.
# Used by Dockerfile.dev for local development with live editing.
#
# Flow:
#   1. Check if /busibox-app volume is mounted
#   2. Build busibox-app (TypeScript -> JavaScript)
#   3. Create npm link from busibox-app
#   4. Link busibox-app in this app's node_modules
#   5. Start the dev server with turbopack
#
# =============================================================================

set -e

echo "========================================"
echo "Development Entrypoint"
echo "========================================"

# Check if busibox-app is mounted
if [ -d "/busibox-app" ]; then
    echo "[1/4] Found busibox-app at /busibox-app"
    
    # Build busibox-app if needed
    if [ ! -d "/busibox-app/dist" ] || [ "/busibox-app/src" -nt "/busibox-app/dist" ]; then
        echo "[2/4] Building busibox-app..."
        cd /busibox-app
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "      Installing busibox-app dependencies..."
            npm install --ignore-scripts
        fi
        
        # Build TypeScript
        npm run build
        echo "      Build complete"
    else
        echo "[2/4] busibox-app already built (dist exists)"
    fi
    
    # Create global npm link
    echo "[3/4] Creating npm link for @jazzmind/busibox-app..."
    cd /busibox-app
    npm link 2>/dev/null || true
    
    # Link in this app
    echo "[4/4] Linking @jazzmind/busibox-app in /app..."
    cd /app
    npm link @jazzmind/busibox-app 2>/dev/null || true
    
    echo ""
    echo "busibox-app linked successfully!"
    echo "  node_modules/@jazzmind/busibox-app -> /busibox-app"
    echo ""
else
    echo "[INFO] /busibox-app not mounted - using npm package"
    echo ""
fi

echo "========================================"
echo "Starting development server..."
echo "========================================"
echo ""

# Execute the CMD (passed as arguments to this script)
exec "$@"
