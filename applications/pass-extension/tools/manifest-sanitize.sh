#!/usr/bin/env bash

if [[ "$NODE_ENV" == "production" ]]; then
    if [[ "$BUILD_TARGET" == "firefox" ]]; then
        jq '.content_scripts[1].matches = ["https://account.proton.me/*"]' dist/manifest.json >dist/manifest.tmp
        mv dist/manifest.tmp dist/manifest.json
        echo "Updated firefox manifest for production"
    elif [[ "$BUILD_TARGET" == "chrome" ]]; then
        jq '.externally_connectable.matches = ["https://account.proton.me/*"]' dist/manifest.json >dist/manifest.tmp
        mv dist/manifest.tmp dist/manifest.json
        echo "Updated chrome manifest for production"
    fi
fi
