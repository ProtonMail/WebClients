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
        printf "\t✅ %s\n" "$arg"
    done
}

function set_manifest_key {
    local key=$(jq -r ".[\"$2\"]" "$PASSDIR/manifest-keys.json")
    jq --indent 4 --arg key "$key" '. + {"key": $key}' "$1" >manifest.json.tmp && mv manifest.json.tmp "$1"
}

function build_chromium_black {
    on_enter "Chromium (Black)"
    BUILD_TARGET=chrome MANIFEST_KEY="" yarn run build:extension:dev >/dev/null

    cd dist

    # QA Black Chrome Build
    set_manifest_key "./manifest.json" "chrome:production"
    zip -rqX "$ARTEFACTSDIR/chrome/$BUILD_ID.black.zip" "."

    on_leave "chrome/$BUILD_ID.black.zip"
}

function build_edge_black {
    on_enter "Edge (Black)"
    BUILD_TARGET=chrome BULD_STORE_TARGET=edge MANIFEST_KEY="" yarn run build:extension:dev >/dev/null

    cd dist

    # QA Black Edge Build
    set_manifest_key "./manifest.json" "edge:production"
    zip -rqX "$ARTEFACTSDIR/edge/$BUILD_ID.black.zip" "."

    on_leave "edge/$BUILD_ID.black.zip"
}

function build_chromium_prod {
    on_enter "Chromium (Prod)"

    # store versions should not have a `key` in the manifest
    RELEASE=true BUILD_TARGET=chrome MANIFEST_KEY="" yarn run build:extension >/dev/null

    cd dist

    # Chromium store version for release
    zip -rqX "$ARTEFACTSDIR/release/$BUILD_ID-chromium.zip" "."

    # QA Production Chrome build
    set_manifest_key "./manifest.json" "chrome:production"
    zip -rqX "$ARTEFACTSDIR/chrome/$BUILD_ID.zip" "."

    on_leave "release/$BUILD_ID-chromium.zip" "chrome/$BUILD_ID.zip"
}

function build_edge_prod {
    on_enter "Edge (Prod)"

    # store versions should not have a `key` in the manifest
    RELEASE=true BUILD_TARGET=chrome BULD_STORE_TARGET=edge MANIFEST_KEY="" yarn run build:extension >/dev/null

    cd dist

    # Edge store version for release
    zip -rqX "$ARTEFACTSDIR/release/$BUILD_ID-edge.zip" "."

    # QA Production Edge build
    set_manifest_key "./manifest.json" "edge:production"
    zip -rqX "$ARTEFACTSDIR/edge/$BUILD_ID.zip" "."

    on_leave "release/$BUILD_ID-edge.zip" "edge/$BUILD_ID.zip"
}

function build_firefox_black {
    on_enter "Firefox (Black)"
    BUILD_TARGET=firefox yarn run build:extension:dev >/dev/null
    cd dist
    zip -rqX "$ARTEFACTSDIR/firefox/$BUILD_ID.black.zip" "."

    on_leave "firefox/$BUILD_ID.black.zip"
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
        -x "test/*" \
        -x "packages/config/*" \
        -x "packages/drive/*" \
        -x "packages/drive-store/*" \
        -x "packages/docs-proto/*" \
        -x "packages/docs-core/*" \
        -x "packages/docs-shared/*" \
        -x "packages/raw-images/tests/*" \
        -x "applications/pass-extension/dist/*" \
        -x "applications/pass-extension/*.md" \
        -x ".yarn/install-state.gz" \
        -x ".yarn/cache/*"

    cd "$PASSDIR"
    zip -uqX "$OUTDIR/$BUILD_ID-FF-sources.zip" "FIREFOX_REVIEWERS.md"
    mv "$OUTDIR/$BUILD_ID-FF-sources.zip" "$ARTEFACTSDIR/release"
    on_leave "release/$BUILD_ID-FF-sources.zip"

    on_enter "Firefox (Prod)"
    mkdir -p "$OUTDIR/$BUILD_ID-FF-sources"
    cd "$OUTDIR/$BUILD_ID-FF-sources"
    unzip -q "$ARTEFACTSDIR/release/$BUILD_ID-FF-sources.zip"
    yarn install --no-immutable >/dev/null
    cd applications/pass-extension
    RELEASE=true yarn run build:extension:ff >/dev/null
    cd dist
    zip -rqX "$ARTEFACTSDIR/release/$BUILD_ID-FF.zip" "."
    on_leave "release/$BUILD_ID-FF.zip"
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
mkdir -p "$ARTEFACTSDIR/chrome"
mkdir -p "$ARTEFACTSDIR/edge"
mkdir -p "$ARTEFACTSDIR/firefox"
mkdir -p "$ARTEFACTSDIR/safari"
mkdir -p "$ARTEFACTSDIR/release"

# Execute individual builds
build_firefox_black
build_firefox_prod

build_chromium_prod
build_chromium_black

build_edge_prod
build_edge_black
