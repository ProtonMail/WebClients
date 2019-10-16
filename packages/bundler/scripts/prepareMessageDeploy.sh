#!/usr/bin/env bash
set -eo pipefail

OUTPUT_DIR='/tmp/deployMessage';

# Check if we have a cache for the CLI
if [ -f "$OUTPUT_DIR/generate" ]; then
    cd $OUTPUT_DIR;
    git pull origin master;
    exit 0;
fi;

git clone --depth 1 "$1" "$OUTPUT_DIR";
