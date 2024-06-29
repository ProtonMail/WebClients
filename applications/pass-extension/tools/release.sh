#!/usr/bin/env bash

remove_sourcemaps() {
    local folder=$1

    find "$folder" -type f -name '*.map' -exec rm -f {} +
    find "$folder" -type f -name '*.js' -exec sed -e '/\/\/# sourceMappingURL=/d' -i.bak {} +
    find "$folder" -type f -name '*.css' -exec sed -e '/\/\*# sourceMappingURL=/d' -i.bak {} +
    find "$folder" -type f -name '*.bak' -delete

    printf "🧹 Sourcemap files removed and references cleaned\n"
}

if [[ -n "${RELEASE:-}" ]]; then
    remove_sourcemaps $1
fi
