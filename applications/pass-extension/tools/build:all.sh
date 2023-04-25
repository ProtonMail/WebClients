#!/usr/bin/env bash

rm -rf ./release

VERSION=$(cat ./manifest-chrome.json | jq -r .version)

echo "Building for chrome & firefox"

mkdir -p "./release/ProtonPass-chrome-${VERSION}"
mkdir -p "./release/ProtonPass-chrome-${VERSION}-black"
mkdir -p "./release/ProtonPass-firefox-${VERSION}"
mkdir -p "./release/ProtonPass-firefox-${VERSION}-black"

BUILD_TARGET=chrome yarn run build
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}"

BUILD_TARGET=chrome yarn run build:dev
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}-black"

BUILD_TARGET=firefox yarn run build
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}"

BUILD_TARGET=firefox yarn run build:dev
mv ./dist/* "./release/ProtonPass-firefox-${VERSION}-black"
