#!/bin/bash

# Link local busibox-app using npm link
# This works with both webpack and Turbopack

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUSIBOX_PATH="$PROJECT_ROOT/../busibox-app"

echo ""
echo -e "${YELLOW}Setting up local busibox-app link...${NC}"
echo ""

# Check if busibox-app exists
if [ ! -d "$BUSIBOX_PATH" ]; then
    echo -e "${RED}✗ busibox-app not found at: $BUSIBOX_PATH${NC}"
    echo ""
    echo "Please clone busibox-app first:"
    echo "  cd $(dirname "$PROJECT_ROOT")"
    echo "  git clone <busibox-app-repo>"
    exit 1
fi

# Step 1: Switch to dev package.json in busibox-app
echo -e "${YELLOW}Step 1: Switching busibox-app to dev mode (src/ instead of dist/)...${NC}"
cd "$BUSIBOX_PATH"

# Backup original package.json if not already backed up
if [ ! -f "package.json.prod" ]; then
    cp package.json package.json.prod
    echo -e "${GREEN}✓ Backed up package.json → package.json.prod${NC}"
fi

# Use dev package.json that points to src/
if [ -f "package.dev.json" ]; then
    cp package.dev.json package.json
    echo -e "${GREEN}✓ Switched to dev mode (using src/ files)${NC}"
else
    echo -e "${YELLOW}⚠ package.dev.json not found, using existing package.json${NC}"
fi
echo ""

# Step 2: Create global link in busibox-app
echo -e "${YELLOW}Step 2: Creating global npm link in busibox-app...${NC}"
npm link
echo -e "${GREEN}✓ Global link created${NC}"
echo ""

# Step 3: Link in ai-portal
echo -e "${YELLOW}Step 3: Linking @jazzmind/busibox-app in ai-portal...${NC}"
cd "$PROJECT_ROOT"
npm link @jazzmind/busibox-app
echo -e "${GREEN}✓ Local link established${NC}"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Local development mode active:"
echo "  • busibox-app using src/ files (instant changes!)"
echo "  • ai-portal linked to local busibox-app"
echo ""
echo "Next steps:"
echo "  1. Restart your dev server: npm run dev"
echo "  2. Make changes in busibox-app/src/"
echo "  3. Restart dev server to see changes (no build needed!)"
echo ""
echo "To unlink:"
echo "  npm run unlink:local"
echo ""

