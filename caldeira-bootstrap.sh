#!/bin/bash
# Caldeira VM SDK - Bootstrap
# Download the latest SDK from GitHub Releases.
#
# Usage:
#   curl -sL https://github.com/giuseppe-palmeri/Caldeira-VM-Releases/.../caldeira-bootstrap.sh | bash
#   bash caldeira-bootstrap.sh [--install-dir <path>]
set -euo pipefail

REPO="giuseppe-palmeri/Caldeira-VM-Releases"
API_URL="https://api.github.com/repos/$REPO/releases/latest"

# Default install directory
INSTALL_DIR="${CALDEIRA_SDK:-$HOME/.caldeira/sdk}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}== Caldeira VM SDK Bootstrap ==${NC}"
echo ""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --install-dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: bash caldeira-bootstrap.sh [--install-dir <path>]"
            echo ""
            echo "Download and install the latest Caldeira VM SDK."
            echo ""
            echo "Options:"
            echo "  --install-dir <path>  Install directory"
            echo "                        (default: \$CALDEIRA_SDK or ~/.caldeira/sdk)"
            echo "  --help, -h            Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check dependencies
for cmd in curl python3 unzip; do
    if ! command -v "$cmd" &>/dev/null; then
        echo -e "${RED}Error: '$cmd' is required but not installed.${NC}"
        exit 1
    fi
done

# Step 1: Query latest release
echo -e "  ${CYAN}*${NC} Checking latest version..."
RELEASE_JSON=$(curl -s "$API_URL")
if [ -z "$RELEASE_JSON" ]; then
    echo -e "${RED}Error: Could not reach GitHub API.${NC}"
    exit 1
fi

# Extract version tag
TAG=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tag_name', 'unknown'))
" 2>/dev/null || echo "unknown")

# Find the SDK zip asset URL
ZIP_URL=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d.get('assets', []):
    if a['name'].endswith('-linux.zip'):
        print(a['browser_download_url'])
        break
" 2>/dev/null || true)

if [ -z "$ZIP_URL" ]; then
    echo -e "${RED}Error: No SDK zip found in the latest release.${NC}"
    exit 1
fi

echo -e "  ${CYAN}*${NC} Latest version: ${TAG}"

# Step 2: Check if already installed and up-to-date
VERSION_FILE="$INSTALL_DIR/VERSION"
if [ -f "$VERSION_FILE" ]; then
    INSTALLED_VERSION=$(cat "$VERSION_FILE")
    if [ "$INSTALLED_VERSION" = "$TAG" ]; then
        echo -e "  ${GREEN}*${NC} Already up-to-date (${TAG}). Nothing to do."
        echo ""
        echo "  To force reinstall: rm -rf \"$INSTALL_DIR\" && bash caldeira-bootstrap.sh"
        exit 0
    fi
    echo -e "  ${CYAN}*${NC} Installed: ${INSTALLED_VERSION} -> updating to ${TAG}"
else
    echo -e "  ${CYAN}*${NC} Not installed yet."
fi

# Step 3: Download
echo -e "  ${CYAN}*${NC} Downloading..."
TMP_DIR=$(mktemp -d)
TMP_ZIP="$TMP_DIR/caldeira-sdk.zip"

curl -sL -o "$TMP_ZIP" "$ZIP_URL"
if [ ! -f "$TMP_ZIP" ] || [ ! -s "$TMP_ZIP" ]; then
    echo -e "${RED}Error: Download failed.${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# Step 4: Extract
echo -e "  ${CYAN}*${NC} Extracting to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
unzip -o -q "$TMP_ZIP" -d "$TMP_DIR/extracted" 2>/dev/null

# The zip contains a subdirectory 'caldeira-sdk-linux/'
EXTRACTED_DIR="$TMP_DIR/extracted"
if [ -d "$EXTRACTED_DIR/caldeira-sdk-linux" ]; then
    EXTRACTED_DIR="$EXTRACTED_DIR/caldeira-sdk-linux"
fi

# Copy contents to install dir
cp -r "$EXTRACTED_DIR"/* "$INSTALL_DIR/" 2>/dev/null || cp -r "$EXTRACTED_DIR"/. "$INSTALL_DIR/" 2>/dev/null

# Write version file
echo "$TAG" > "$VERSION_FILE"

# Cleanup
rm -rf "$TMP_DIR"

# Step 5: Verify
CALDEIRA_BIN="$INSTALL_DIR/bin/caldeira"
if [ -f "$CALDEIRA_BIN" ]; then
    chmod +x "$CALDEIRA_BIN"
    echo -e "  ${GREEN}*${NC} caldeira: $CALDEIRA_BIN"
else
    echo -e "${RED}Error: caldeira binary not found after extraction.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}== Caldeira VM SDK ${TAG} installed! ==${NC}"
echo ""
echo "SDK directory: $INSTALL_DIR"
echo ""
echo "Add to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
echo ""
echo "  export CALDEIRA_SDK=\"$INSTALL_DIR\""
echo "  export PATH=\"\$CALDEIRA_SDK/bin:\$PATH\""
echo ""
echo "Then use:"
echo "  caldeira new my-project"
echo "  caldeira build"
echo "  caldeira run"
echo "  caldeira get-sdk    # update to latest version"
