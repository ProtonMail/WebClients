#!/usr/bin/env bash

rm -rf ./release

VERSION=$(cat ./manifest-chrome.json | jq -r .version)

echo "Building for chrome & firefox"

mkdir -p "./release/ProtonPass-chrome-${VERSION}"
mkdir -p "./release/ProtonPass-chrome-${VERSION}-black"
mkdir -p "./release/ProtonPass-firefox-${VERSION}"
mkdir -p "./release/ProtonPass-firefox-${VERSION}-black"

NODE_ENV=production BUILD_TARGET=chrome yarn run build
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}"

NODE_ENV=development BUILD_TARGET=chrome yarn run build
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}-black"

NODE_ENV=production BUILD_TARGET=firefox yarn run build
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}"

NODE_ENV=development BUILD_TARGET=firefox yarn run build
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}-black"
