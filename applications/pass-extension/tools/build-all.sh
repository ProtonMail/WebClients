#!/usr/bin/env bash
set -euo pipefail


REPODIR="$(git rev-parse --show-toplevel)"
PASSDIR="$REPODIR/applications/pass-extension"
VERSION="$(jq -r .version < "$PASSDIR/manifest-chrome.json")${BETA:+-beta}"
OUTDIR="$REPODIR/build"
COMMIT="$(git rev-parse --short HEAD)"
BUILD_ID="ProtonPass-${VERSION}-${COMMIT}"


echo "Building for all platforms... This may take a while."
printf "\tNode\t%s (%s)\n" "$(node --version)" "$(which node)"
printf "\tnpm\tv%s (%s)\n" "$(npm --version)" "$(which npm)"
printf "\tYarn\tv%s (%s)\n" "$(yarn --version)" "$(which yarn)"
for var in "REPODIR" "PASSDIR" "VERSION" "OUTDIR" "COMMIT" "BUILD_ID"; do
    printf "\t%s = %s\n" "${var}" "${!var}"
done


# Validate dependencies
echo "Validating yarn.lock..."
if [ -z ${CI+n} ]; then
    cd "$REPODIR"
    yarn install --immutable --immutable-cache > /dev/null
    printf "\t✅ %s\n" "OK"
else
    printf "\t⚠️ Skipped, \$CI var is already set\n"
fi


mkdir -p "$OUTDIR"
cd "$PASSDIR"


# Chrome production release
echo "Building Chrome (Prod)..."
BUILD_TARGET=chrome yarn run build > /dev/null
cd dist
tar -cf "$OUTDIR/$BUILD_ID-chrome.tar" "."
cd ..
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-chrome.tar"


# Chrome development (Black) release
echo "Building Chrome (Black)..."
BUILD_TARGET=chrome yarn run build:dev > /dev/null
mv "./dist" "$OUTDIR/black-$BUILD_ID-chrome"
printf "\t✅ %s\n" "$OUTDIR/black-$BUILD_ID-chrome"


# Firefox production release
echo "Building Firefox (Sources)..."
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
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-FF-sources.tar"


# Firefox build
echo "Building Firefox (Prod)..."
yarn run build:ff > /dev/null
cd dist
tar -cf "$OUTDIR/$BUILD_ID-FF.tar" "."
cd ..
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-FF.tar"


# Verify FF reproducibility
echo "Verifying Firefox reproducibility..."
# Extract build
mkdir -p "$OUTDIR/$BUILD_ID-FF"
cd "$OUTDIR/$BUILD_ID-FF"
tar xf "$OUTDIR/$BUILD_ID-FF.tar"

# Extract sources
mkdir -p "$OUTDIR/$BUILD_ID-FF-sources"
cd "$OUTDIR/$BUILD_ID-FF-sources"
tar xf "$OUTDIR/$BUILD_ID-FF-sources.tar"

# Build and diff
yarn install > /dev/null
cd applications/pass-extension
yarn run build:ff > /dev/null
diff -qr dist "$OUTDIR/$BUILD_ID-FF"
cd "$PASSDIR"
printf "\t✅ %s\n" "OK"


# Firefox development (Black) release
echo "Building Firefox (Black)..."
BUILD_TARGET=firefox yarn run build:dev > /dev/null
mv "./dist" "$OUTDIR/black-$BUILD_ID-FF"
printf "\t✅ %s\n" "$OUTDIR/black-$BUILD_ID-FF"
