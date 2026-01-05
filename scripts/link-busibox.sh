#!/bin/bash

# Link/unlink local busibox-app for development
# This script helps manage the development workflow

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUSIBOX_PATH="$(cd "$PROJECT_ROOT/../busibox-app" 2>/dev/null && pwd || echo "")"

show_status() {
    echo ""
    echo -e "${YELLOW}Current Setup:${NC}"
    
    if [ -d "$BUSIBOX_PATH/src" ]; then
        echo -e "${GREEN}✓ Local busibox-app found at: $BUSIBOX_PATH${NC}"
        echo "  When you run 'npm run dev', changes to busibox-app will be reflected immediately"
        echo "  No need to publish or reinstall!"
    else
        echo -e "${YELLOW}⚠ Local busibox-app not found${NC}"
        echo "  Using npm package: @jazzmind/busibox-app"
        echo "  To use local development:"
        echo "    1. Clone busibox-app to: $(dirname "$PROJECT_ROOT")/busibox-app"
        echo "    2. Run this script again"
    fi
    
    echo ""
    echo "TypeScript paths configured in tsconfig.json:"
    echo "  @jazzmind/busibox-app → ../busibox-app/src/index.ts"
    echo ""
    echo "Webpack alias configured in next.config.ts:"
    echo "  Automatically uses local path when available"
    echo ""
}

check_local() {
    if [ -d "$BUSIBOX_PATH/src" ]; then
        echo -e "${GREEN}✓ Local busibox-app is available${NC}"
        echo "  Path: $BUSIBOX_PATH"
        echo ""
        echo "To use it:"
        echo "  1. Make changes in busibox-app"
        echo "  2. Restart 'npm run dev' in ai-portal"
        echo "  3. Changes appear immediately (no publish needed!)"
        return 0
    else
        echo -e "${RED}✗ Local busibox-app not found${NC}"
        echo ""
        echo "Expected location: $(dirname "$PROJECT_ROOT")/busibox-app"
        echo ""
        echo "To set up local development:"
        echo "  cd $(dirname "$PROJECT_ROOT")"
        echo "  git clone <busibox-app-repo-url> busibox-app"
        return 1
    fi
}

case "${1:-status}" in
    status)
        show_status
        ;;
    check)
        check_local
        ;;
    info)
        echo ""
        echo -e "${GREEN}Local Development Setup${NC}"
        echo ""
        echo "This project is configured to automatically use local busibox-app"
        echo "when it's available at: ../busibox-app"
        echo ""
        echo "How it works:"
        echo "  1. TypeScript paths in tsconfig.json resolve imports"
        echo "  2. Webpack aliases in next.config.ts handle bundling"
        echo "  3. Changes to busibox-app appear after restarting dev server"
        echo ""
        echo "Benefits:"
        echo "  ✓ No need to publish busibox-app for every change"
        echo "  ✓ No need to run npm install after changes"
        echo "  ✓ Just restart dev server to see changes"
        echo "  ✓ Automatic fallback to npm package in production"
        echo ""
        echo "Production builds:"
        echo "  When ../busibox-app doesn't exist, uses npm package automatically"
        echo ""
        ;;
    *)
        echo "Usage: $0 [status|check|info]"
        echo ""
        echo "Commands:"
        echo "  status  - Show current configuration (default)"
        echo "  check   - Check if local busibox-app is available"
        echo "  info    - Show detailed information about local dev setup"
        exit 1
        ;;
esac

