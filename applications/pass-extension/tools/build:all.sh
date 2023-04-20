#!/usr/bin/env bash

rm -rf ./release

VERSION=$(cat ./manifest-chrome.json | jq -r .version)

echo "Building for chrome & firefox"

mkdir -p "./release/ProtonPass-chrome-${VERSION}"
mkdir -p "./release/ProtonPass-chrome-${VERSION}-black"

BUILD_TARGET=chrome yarn run build
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}"

BUILD_TARGET=chrome yarn run build:dev
mv ./dist/* "./release/ProtonPass-chrome-${VERSION}-black"

cp -R "./release/ProtonPass-chrome-${VERSION}" "./release/ProtonPass-firefox-${VERSION}"
cp -R "./release/ProtonPass-chrome-${VERSION}-black" "./release/ProtonPass-firefox-${VERSION}-black"

rm "./release/ProtonPass-firefox-${VERSION}/manifest.json"
rm "./release/ProtonPass-firefox-${VERSION}-black/manifest.json"

cp "./manifest-firefox.json" "./release/ProtonPass-firefox-${VERSION}/manifest.json"
cp "./manifest-firefox.json" "./release/ProtonPass-firefox-${VERSION}-black/manifest.json"
