#!/usr/bin/env bash
set -euo pipefail


REPODIR="$(git rev-parse --show-toplevel)"
PASSDIR="$REPODIR/applications/pass-extension"
VERSION="$(jq -r .version < "$PASSDIR/manifest-chrome.json")${BETA:+-beta}"
ARTEFACTSDIR="$REPODIR/build"
OUTDIR="$(mktemp -d)"
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


cd "$PASSDIR"


# Chrome production release
echo "Building Chrome (Prod)..."
BUILD_TARGET=chrome yarn run build > /dev/null
cd dist
zip -rqX "$OUTDIR/$BUILD_ID-chrome.zip" "."
cd ..
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-chrome.zip"


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
zip -rqX "$OUTDIR/$BUILD_ID-FF-sources.zip"         \
    "applications/pass-extension"                  \
    "packages"                                     \
    "utilities"                                    \
    "yarn.lock"                                    \
    ".yarn/patches"                                \
    ".yarn/releases"                               \
    ".yarnrc.yml"                                  \
    ./*.js                                         \
    ./*.json                                       \
    ./*.mjs                                        \
    -x "*/.DS_Store"                               \
    -x "*/node_modules/*"                          \
    -x "packages/config/*"                         \
    -x "applications/pass-extension/dist/*"        \
    -x "applications/pass-extension/*.md"
cd "$PASSDIR"
zip -uqX "$OUTDIR/$BUILD_ID-FF-sources.zip" "FIREFOX_REVIEWERS.md"
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-FF-sources.zip"


# Firefox build
echo "Building Firefox (Prod)..."
yarn run build:ff > /dev/null
cd dist
zip -rqX "$OUTDIR/$BUILD_ID-FF.zip" "."
cd ..
printf "\t✅ %s\n" "$OUTDIR/$BUILD_ID-FF.zip"


# Verify FF reproducibility
echo "Verifying Firefox reproducibility..."
# Extract build
mkdir -p "$OUTDIR/$BUILD_ID-FF"
cd "$OUTDIR/$BUILD_ID-FF"
unzip -q "$OUTDIR/$BUILD_ID-FF.zip"

# Extract sources
mkdir -p "$OUTDIR/$BUILD_ID-FF-sources"
cd "$OUTDIR/$BUILD_ID-FF-sources"
unzip -q "$OUTDIR/$BUILD_ID-FF-sources.zip"

# Build and diff
yarn install --no-immutable > /dev/null
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


# Move tmp files into place
echo "Moving files into place..."
rm -rf "${ARTEFACTSDIR:-}"
mv "$OUTDIR" "$ARTEFACTSDIR"
printf "\t✅ %s\n" "$ARTEFACTSDIR"
