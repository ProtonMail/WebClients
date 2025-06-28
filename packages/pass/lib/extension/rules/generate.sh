#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(realpath "$(dirname "$0")")"

declare -A SCHEMAS=(
    ["v1"]="https://proton.me/download/pass/auto-detection/schema.json"
    ["v2"]="https://proton.me/download/pass/auto-detection/schema.experimental.json"
)

declare -A RULES=(
    ["v1"]="https://proton.me/download/pass/auto-detection/rules.json"
    ["v2"]="https://proton.me/download/pass/auto-detection/rules.experimental.json"
)

for version in "${!SCHEMAS[@]}"; do
    version_dir="$SCRIPT_DIR/$version"
    schema_file="$version_dir/schema.json"
    rules_file="$version_dir/rules.json"
    types_file="$version_dir/types.ts"

    curl -sf "${SCHEMAS[$version]}" >"$schema_file"
    curl -sf "${RULES[$version]}" >"$rules_file"
    yarn json2ts -i "$schema_file" -o "$types_file"

    echo "  ✓ $version completed"
done
