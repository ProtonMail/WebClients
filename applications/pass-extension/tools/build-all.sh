#!/usr/bin/env bash

rm -rf ./release

VERSION="$(cat ./manifest-chrome.json | jq -r .version)${BETA:+-beta}"

echo "Building for chrome & firefox"

BUILD_TARGET=chrome yarn run build
mkdir -p "./release/ProtonPass-chrome-${VERSION}"
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}"

BUILD_TARGET=chrome yarn run build:dev
mkdir -p "./release/ProtonPass-chrome-${VERSION}-black"
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}-black"

BUILD_TARGET=firefox yarn run build
mkdir -p "./release/ProtonPass-firefox-${VERSION}"
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}"

BUILD_TARGET=firefox yarn run build:dev
mkdir -p "./release/ProtonPass-firefox-${VERSION}-black"
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}-black"
