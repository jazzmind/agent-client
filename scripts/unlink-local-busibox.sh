#!/bin/bash

# Unlink local busibox-app and restore npm package

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${YELLOW}Unlinking local busibox-app...${NC}"
echo ""

cd "$PROJECT_ROOT"

# Unlink
npm unlink @jazzmind/busibox-app 2>/dev/null || true

# Reinstall from npm
echo -e "${YELLOW}Reinstalling from npm...${NC}"
npm install @jazzmind/busibox-app

# Restore original package.json in busibox-app
BUSIBOX_PATH="$PROJECT_ROOT/../busibox-app"
if [ -f "$BUSIBOX_PATH/package.json.prod" ]; then
    echo -e "${YELLOW}Restoring busibox-app to production mode...${NC}"
    cd "$BUSIBOX_PATH"
    cp package.json.prod package.json
    echo -e "${GREEN}✓ Restored package.json${NC}"
fi

echo ""
echo -e "${GREEN}✅ Restored npm package${NC}"
echo ""
echo "Restart your dev server to use the npm version"
echo ""

