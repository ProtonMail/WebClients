#!/bin/bash

if [ -z "$1" ]; then
    echo "Please provide a new version number as an argument."
    echo "Usage: \`yarn workspace @proton/pass run version:update <new_version>\`"
    exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

FILES=(
    "applications/pass-extension/manifest-chrome.json"
    "applications/pass-extension/manifest-firefox.json"
    "applications/pass-extension/manifest-safari.json"
    "applications/pass-desktop/package.json"
)

for json in "${FILES[@]}"; do
    file="$ROOT_DIR/$json"
    if [ -f "$file" ]; then
        tmp=$(mktemp)
        jq --arg version "$1" '.version = $version' "$file" | jq '.' --indent 4 >"$tmp"
        mv "$tmp" "$file"
        echo "Updated version in $json to $1"
    else
        echo "File not found: $json"
    fi
done
