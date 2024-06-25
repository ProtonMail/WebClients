#!/usr/bin/env bash
set -euo pipefail

REPODIR="$(git rev-parse --show-toplevel)"
PASSDIR="$REPODIR/applications/pass-extension"
VERSION="$(jq -r .version <"$PASSDIR/manifest-chrome.json")"
ARTEFACTSDIR="$REPODIR/build"
OUTDIR="$(mktemp -d)"
COMMIT="$(git rev-parse --short HEAD)"
BUILD_ID="ProtonPass-${VERSION}-${COMMIT}"

function on_enter {
    echo "Building $1..."
    cd "$PASSDIR" && rm -rf dist
}

function on_leave {
    rm -rf "${OUTDIR:-}/*"
    for arg in "$@"; do
        printf "\t✅ $ARTEFACTSDIR/%s\n" "$arg"
    done
}

function set_manifest_key {
    local key=$(jq -r ".[\"$2\"]" "$PASSDIR/manifest-keys.json")
    jq --indent 4 --arg key "$key" '. + {"key": $key}' "$1" >manifest.json.tmp && mv manifest.json.tmp "$1"
}

function build_chromium_black {
    on_enter "Chromium (Black)"
    BUILD_TARGET=chrome MANIFEST_KEY="" yarn run build:dev >/dev/null
    cp -r "./dist" "$ARTEFACTSDIR/black-$BUILD_ID-chrome"
    cp -r "./dist" "$ARTEFACTSDIR/black-$BUILD_ID-edge"

    set_manifest_key "$ARTEFACTSDIR/black-$BUILD_ID-chrome/manifest.json" "chrome:production"
    set_manifest_key "$ARTEFACTSDIR/black-$BUILD_ID-edge/manifest.json" "edge:production"

    on_leave "black-$BUILD_ID-chrome" "black-$BUILD_ID-edge"
}

function build_chromium_prod {
    on_enter "Chromium (Prod)"
    BUILD_TARGET=chrome MANIFEST_KEY="" yarn run build >/dev/null
    cp -r "./dist" "$ARTEFACTSDIR/$BUILD_ID-chrome"
    cp -r "./dist" "$ARTEFACTSDIR/$BUILD_ID-edge"

    set_manifest_key "$ARTEFACTSDIR/$BUILD_ID-chrome/manifest.json" "chrome:production"
    set_manifest_key "$ARTEFACTSDIR/$BUILD_ID-edge/manifest.json" "edge:production"

    cd dist
    # store versions should not have a `key` in the manifest
    zip -rqX "$ARTEFACTSDIR/$BUILD_ID-chromium.zip" "."

    on_leave "$BUILD_ID-chromium.zip" "$BUILD_ID-chrome" "$BUILD_ID-edge"
}

function build_firefox_black {
    on_enter "Firefox (Black)"
    BUILD_TARGET=firefox yarn run build:dev >/dev/null
    cp -r "./dist" "$ARTEFACTSDIR/black-$BUILD_ID-FF"
    on_leave "black-$BUILD_ID-FF"
}

function build_firefox_prod {
    on_enter "Firefox (Sources)"
    BUILD_TARGET=firefox NODE_ENV=production yarn run config
    # Preserve config.ts because the `yarn` postinstall script will overwrite it
    cp src/app/config.ts src/app/config.ff-release.ts
    cd ../../
    zip -rqX "$OUTDIR/$BUILD_ID-FF-sources.zip" \
        "applications/pass-extension" \
        "packages" \
        "utilities" \
        "yarn.lock" \
        ".yarn" \
        ".yarnrc.yml" \
        ./*.js \
        ./*.json \
        ./*.mjs \
        -x "*/.DS_Store" \
        -x "*/node_modules/*" \
        -x "packages/config/*" \
        -x "applications/pass-extension/dist/*" \
        -x "applications/pass-extension/*.md" \
        -x ".yarn/install-state.gz" \
        -x ".yarn/cache/*"
    cd "$PASSDIR"
    zip -uqX "$OUTDIR/$BUILD_ID-FF-sources.zip" "FIREFOX_REVIEWERS.md"
    mv "$OUTDIR/$BUILD_ID-FF-sources.zip" "$ARTEFACTSDIR"
    on_leave "$BUILD_ID-FF-sources.zip"

    on_enter "Firefox (Prod)"
    mkdir -p "$OUTDIR/$BUILD_ID-FF-sources"
    cd "$OUTDIR/$BUILD_ID-FF-sources"
    unzip -q "$ARTEFACTSDIR/$BUILD_ID-FF-sources.zip"
    yarn install --no-immutable >/dev/null
    cd applications/pass-extension
    yarn run build:ff >/dev/null
    cd dist
    zip -rqX "$ARTEFACTSDIR/$BUILD_ID-FF.zip" "."
    on_leave "$BUILD_ID-FF.zip"
}

# Print debug vars
echo "Building for all platforms... This may take a while."
printf "\tNode\t%s (%s)\n" "$(node --version)" "$(which node)"
printf "\tnpm\tv%s (%s)\n" "$(npm --version)" "$(which npm)"
printf "\tYarn\tv%s (%s)\n" "$(yarn --version)" "$(which yarn)"
for var in "REPODIR" "PASSDIR" "VERSION" "ARTEFACTSDIR" "OUTDIR" "COMMIT" "BUILD_ID"; do
    printf "\t%s = %s\n" "${var}" "${!var}"
done

# Validate dependencies
echo "Validating yarn.lock..."
if [ -z ${CI+n} ]; then
    cd "$REPODIR"
    yarn install --immutable --immutable-cache >/dev/null
    printf "\t✅ %s\n" "OK"
else
    printf "\t⚠️ Skipped, \$CI var is already set\n"
fi

# Set up clean artefacts location
rm -rf "${ARTEFACTSDIR:-}" && mkdir -p "$ARTEFACTSDIR"

# Execute individual builds
build_chromium_prod
build_firefox_prod
build_chromium_black
build_firefox_black
