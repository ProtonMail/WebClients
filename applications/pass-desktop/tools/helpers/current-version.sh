#!/usr/bin/env sh
# Get current version from package.json

get_current_version() {
    local package_json="applications/pass-desktop/package.json"

    # Try jq first (cleaner and more reliable)
    if command -v jq >/dev/null 2>&1; then
        jq -r '.version' "$package_json"
    else
        # Fallback to sed/grep
        grep '"version":' -m 1 "$package_json" | sed 's/.*"version": "\(.*\)".*/\1/'
    fi
}
