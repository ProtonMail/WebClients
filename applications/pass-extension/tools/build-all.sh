#!/usr/bin/env bash
set -euo pipefail


REPODIR="$(git rev-parse --show-toplevel)"
PASSDIR="$REPODIR/applications/pass-extension"
VERSION="$(jq -r .version < "$PASSDIR/manifest-chrome.json")${BETA:+-beta}"
OUTDIR="$REPODIR/build"
COMMIT="$(git rev-parse --short HEAD)"
BUILD_ID="ProtonPass-${VERSION}-${COMMIT}"


echo "Building for Chrome & Firefox... This may take a while."
mkdir -p "$OUTDIR"
cd "$PASSDIR"


# Chrome production release
BUILD_TARGET=chrome yarn run build > /dev/null
cd dist
tar -cf "$OUTDIR/$BUILD_ID-chrome.tar" "."
cd ..
echo "✅ Built Chrome (Prod)"
printf "\t%s\n" "$OUTDIR/$BUILD_ID-chrome.tar"


# Chrome development (Black) release
BUILD_TARGET=chrome yarn run build:dev > /dev/null
mv "./dist" "$OUTDIR/$BUILD_ID-chrome-black"
echo "✅ Built Chrome (Black)"
printf "\t%s\n" "$OUTDIR/$BUILD_ID-chrome-black"


# Firefox production release
# Firefox sources
BUILD_TARGET=firefox NODE_ENV=production yarn run config
# Preserve config.ts because the `yarn` postinstall script will overwrite it
cp src/app/config.ts src/app/config.ff-release.ts
cd ../../
tar -c                                             \
    --exclude "*/.DS_Store"                        \
    --exclude "*/node_modules/*"                   \
    --exclude "packages/config/*"                  \
    --exclude "applications/pass-extension/dist/*" \
    --exclude "applications/pass-extension/*.md"   \
    -f "$OUTDIR/$BUILD_ID-FF-sources.tar"          \
    "applications/pass-extension"                  \
    "packages"                                     \
    "utilities"                                    \
    "yarn.lock"                                    \
    ".yarn/patches"                                \
    ".yarn/releases"                               \
    ".yarnrc.yml"                                  \
    ./*.js                                         \
    ./*.json                                       \
    ./*.mjs
cd "$PASSDIR"
tar rf "$OUTDIR/$BUILD_ID-FF-sources.tar" "FIREFOX_REVIEWERS.md"
echo "✅ Built Firefox (Sources)"
printf "\t%s\n" "$OUTDIR/$BUILD_ID-FF-sources.tar"


# Firefox build
BUILD_TARGET=firefox yarn run build:ff > /dev/null
cd dist
tar -cf "$OUTDIR/$BUILD_ID-FF.tar" "."
cd ..
echo "✅ Built Firefox (Prod)"
printf "\t%s\n" "$OUTDIR/$BUILD_ID-FF.tar"


# Firefox development (Black) release
BUILD_TARGET=firefox yarn run build:dev > /dev/null
mv "./dist" "$OUTDIR/$BUILD_ID-FF-black"
echo "✅ Built Firefox (Black)"
printf "\t%s\n" "$OUTDIR/$BUILD_ID-FF-black"
