#!/bin/bash
# Caldeira VM SDK Bootstrap
# Download and manage Caldeira VM SDK versions.
#
# Usage:
#   bash caldeira-bootstrap.sh                    # Install the latest version
#   bash caldeira-bootstrap.sh --list-versions    # Show installed versions
#   bash caldeira-bootstrap.sh --use <version>    # Switch to a specific version
#
# Quick install:
#   curl -sL https://raw.githubusercontent.com/giuseppe-palmeri/Caldeira-VM-Releases/main/caldeira-bootstrap.sh | bash
set -euo pipefail

REPO="giuseppe-palmeri/Caldeira-VM-Releases"
API_URL="https://api.github.com/repos/$REPO/releases/latest"

# Root directory
CALDEIRA_ROOT="${CALDEIRA_ROOT:-$HOME/.caldeira}"
VERSIONS_DIR="$CALDEIRA_ROOT/versions"
CURRENT_LINK="$CALDEIRA_ROOT/current"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}== Caldeira VM SDK Bootstrap ==${NC}"
echo ""

# ── Helper: get current version tag from API ──
get_latest_tag() {
    curl -s "$API_URL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tag_name', ''))
" 2>/dev/null || echo ""
}

get_latest_zip_url() {
    curl -s "$API_URL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d.get('assets', []):
    if a['name'].endswith('-linux.zip'):
        print(a['browser_download_url'])
        break
" 2>/dev/null || true
}

# ── Command: list installed versions ──
cmd_list_versions() {
    echo "Installed versions:"
    echo ""
    if [ ! -d "$VERSIONS_DIR" ] || [ -z "$(ls -A "$VERSIONS_DIR" 2>/dev/null)" ]; then
        echo "  (none)"
        echo ""
        echo "Install the latest version:"
        echo "  bash caldeira-bootstrap.sh"
        return
    fi

    local current=""
    if [ -L "$CURRENT_LINK" ]; then
        current=$(readlink "$CURRENT_LINK")
        current="${current#versions/}"
    fi

    for ver in "$VERSIONS_DIR"/*/; do
        ver=$(basename "$ver")
        if [ "$ver" = "$current" ]; then
            echo -e "  ${GREEN}* ${ver}${NC} (active)"
        else
            echo "    $ver"
        fi
    done
    echo ""
    echo "Switch version:"
    echo "  bash caldeira-bootstrap.sh --use <version>"
    echo "  caldeira use <version>"
}

# ── Command: switch version ──
cmd_use_version() {
    local version="$1"
    if [ ! -d "$VERSIONS_DIR/$version" ]; then
        echo -e "${RED}Error: version '$version' is not installed.${NC}"
        echo ""
        echo "Installed versions:"
        for ver in "$VERSIONS_DIR"/*/; do
            echo "  - $(basename "$ver")"
        done
        exit 1
    fi

    ln -snf "versions/$version" "$CURRENT_LINK"
    echo "$version" > "$CALDEIRA_ROOT/VERSION"
    # Aggiorna i symlink in ~/.local/bin
    setup_local_bin_symlinks
    echo -e "${GREEN}Switched to ${version}${NC}"
    echo ""
    echo "  CALDEIRA_SDK=$CURRENT_LINK"
    echo "  PATH=\$CALDEIRA_SDK/bin:\$PATH"
}

# ── Symlink in ~/.local/bin (se presente nel PATH) ──
setup_local_bin_symlinks() {
    local local_bin="$HOME/.local/bin"
    if [ ! -d "$local_bin" ]; then
        return 1
    fi
    # Controlla se ~/.local/bin è nel PATH
    if ! echo ":$PATH:" | grep -q ":$local_bin:" 2>/dev/null; then
        return 1
    fi
    mkdir -p "$local_bin"
    for tool in caldeira clasto clasto-lsp lava magma; do
        local src="$CURRENT_LINK/bin/$tool"
        if [ -f "$src" ]; then
            ln -sf "$src" "$local_bin/$tool" 2>/dev/null || true
        fi
    done
    return 0
}

# ── Configura profilo shell (fallback) ──
setup_shell_profile() {
    local rc_file=""
    case "${SHELL:-}" in
        *zsh*) rc_file="$HOME/.zshrc" ;;
        *bash*) rc_file="$HOME/.bashrc" ;;
        *) rc_file="$HOME/.profile" ;;
    esac

    # Fallback se il file non esiste
    if [ ! -f "$rc_file" ]; then
        [ -f "$HOME/.zprofile" ] && rc_file="$HOME/.zprofile"
        [ -f "$HOME/.bash_profile" ] && rc_file="$HOME/.bash_profile"
        [ -f "$HOME/.profile" ] && rc_file="$HOME/.profile"
        [ ! -f "$rc_file" ] && rc_file="$HOME/.profile"
    fi

    local caldeira_export="export CALDEIRA_SDK=\"$CURRENT_LINK\""
    local path_export="export PATH=\"\$CALDEIRA_SDK/bin:\$PATH\""

    if grep -q "CALDEIRA_SDK" "$rc_file" 2>/dev/null; then
        echo -e "  ${GREEN}*${NC} Shell profile already configured ($rc_file)"
        return
    fi

    echo ""
    echo "  Would you like to add Caldeira to your shell profile?"
    echo "  File: $rc_file"
    echo ""
    echo "    $caldeira_export"
    echo "    $path_export"
    echo ""
    read -p "  Add to profile? [Y/n] " -n 1 REPLY </dev/tty 2>/dev/null || REPLY="y"
    echo ""

    if [ -z "$REPLY" ] || [[ "$REPLY" =~ ^[Yy]$ ]]; then
        echo "" >> "$rc_file"
        echo "# Caldeira VM SDK" >> "$rc_file"
        echo "$caldeira_export" >> "$rc_file"
        echo "$path_export" >> "$rc_file"
        echo -e "  ${GREEN}*${NC} Added to $rc_file"
        echo ""
        echo "  To apply now: source $rc_file"
    else
        echo -e "  ${YELLOW}*${NC} Skipped. To configure manually:"
        echo ""
        echo "    $caldeira_export"
        echo "    $path_export"
    fi
}

# ── Setup PATH: prova ~/.local/bin, poi profilo shell ──
setup_path() {
    echo -e "  ${CYAN}*${NC} Configuring PATH..."
    if setup_local_bin_symlinks; then
        echo -e "  ${GREEN}*${NC} Symlinks created in ~/.local/bin/"
        echo "  (already in PATH - no shell profile changes needed)"
    else
        setup_shell_profile
    fi
}

# ── Parse arguments ──
if [[ $# -gt 0 ]]; then
    case "$1" in
        --list-versions|ls)
            cmd_list_versions
            exit 0
            ;;
        --use|use)
            if [ -z "${2:-}" ]; then
                echo "Usage: bash caldeira-bootstrap.sh --use <version>"
                exit 1
            fi
            cmd_use_version "$2"
            exit 0
            ;;
        --install-dir)
            echo "Error: --install-dir is no longer supported."
            echo "The SDK is now managed in ~/.caldeira/versions/"
            echo "Use: bash caldeira-bootstrap.sh --use <version>"
            exit 1
            ;;
        --help|-h)
            echo "Usage: bash caldeira-bootstrap.sh [command]"
            echo ""
            echo "Commands:"
            echo "  (no args)             Install or update the latest version"
            echo "  --list-versions, ls   Show installed versions"
            echo "  --use <version>       Switch to a specific version"
            echo "  --help, -h            Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: bash caldeira-bootstrap.sh [--list-versions|--use <version>|--help]"
            exit 1
            ;;
    esac
fi

# ── No arguments: install/update the latest version ──

# Check dependencies
for cmd in curl python3 unzip; do
    if ! command -v "$cmd" &>/dev/null; then
        echo -e "${RED}Error: '$cmd' is required but not installed.${NC}"
        exit 1
    fi
done

# Query latest release
echo -e "  ${CYAN}*${NC} Checking latest version..."
TAG=$(get_latest_tag)
if [ -z "$TAG" ]; then
    echo -e "${RED}Error: Could not reach GitHub API.${NC}"
    exit 1
fi

ZIP_URL=$(get_latest_zip_url)
if [ -z "$ZIP_URL" ]; then
    echo -e "${RED}Error: No SDK zip found in the latest release.${NC}"
    exit 1
fi

echo -e "  ${CYAN}*${NC} Latest:  ${TAG}"

# Check if already installed and up-to-date
if [ -d "$VERSIONS_DIR/$TAG" ]; then
    current=""
    if [ -L "$CURRENT_LINK" ]; then
        current=$(readlink "$CURRENT_LINK")
        current="${current#versions/}"
    fi
    if [ "$current" = "$TAG" ]; then
        echo -e "  ${GREEN}*${NC} Already up-to-date (${TAG}). Nothing to do."
        echo ""
        bash "$0" --list-versions
        exit 0
    fi
    echo -e "  ${CYAN}*${NC} Already downloaded, switching to ${TAG}..."
    cmd_use_version "$TAG"
    exit 0
fi

# Download
echo -e "  ${CYAN}*${NC} Downloading..."
TMP_DIR=$(mktemp -d)
TMP_ZIP="$TMP_DIR/caldeira-sdk.zip"

curl -sL -o "$TMP_ZIP" "$ZIP_URL"
if [ ! -f "$TMP_ZIP" ] || [ ! -s "$TMP_ZIP" ]; then
    echo -e "${RED}Error: Download failed.${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# Extract to versions/<tag>/
echo -e "  ${CYAN}*${NC} Installing version ${TAG}..."
mkdir -p "$VERSIONS_DIR"

unzip -o -q "$TMP_ZIP" -d "$TMP_DIR/extracted" 2>/dev/null

EXTRACTED="$TMP_DIR/extracted"
if [ -d "$EXTRACTED/caldeira-sdk-linux" ]; then
    EXTRACTED="$EXTRACTED/caldeira-sdk-linux"
fi

rm -rf "$VERSIONS_DIR/$TAG"
mv "$EXTRACTED" "$VERSIONS_DIR/$TAG"

chmod +x "$VERSIONS_DIR/$TAG/bin/"*

rm -rf "$TMP_DIR"

# Activate
ln -snf "versions/$TAG" "$CURRENT_LINK"
echo "$TAG" > "$CALDEIRA_ROOT/VERSION"

echo -e "  ${GREEN}*${NC} Installed: $VERSIONS_DIR/$TAG"
echo -e "  ${GREEN}*${NC} Active:    $CURRENT_LINK -> $TAG"
echo ""
echo -e "${GREEN}== Caldeira VM SDK ${TAG} installed! ==${NC}"
echo ""

# Configura PATH: ~/.local/bin > profilo shell
setup_path

echo ""
echo "Commands:"
echo "  caldeira new my-project"
echo "  caldeira build"
echo "  caldeira run"
echo "  caldeira get-sdk"
echo ""
echo "Manage versions:"
echo "  caldeira ls                     List installed versions"
echo "  caldeira use <version>          Switch version"
echo "  bash caldeira-bootstrap.sh --list-versions  Alternative via bootstrap"
echo "  bash caldeira-bootstrap.sh --use <version>  Alternative via bootstrap"
