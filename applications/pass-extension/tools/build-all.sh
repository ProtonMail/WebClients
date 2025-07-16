#!/usr/bin/env bash
set -euo pipefail

REPODIR="$(git rev-parse --show-toplevel)"
PASSDIR="$REPODIR/applications/pass-extension"
VERSION="$(jq -r .version <"$PASSDIR/manifest-chrome.json")"
ARTEFACTSDIR="$REPODIR/build"
OUTDIR="$(mktemp -d)"
COMMIT="$(git rev-parse --short HEAD)"
BUILD_ID="ProtonPass-${VERSION}-${COMMIT}"

export NODE_NO_WARNINGS=1

function on_enter {
    echo -e "\nBuilding $1..."
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

# Bundle extension for specific store target and environment
# Usage: bundle_extension <env> <store_target> [beta]
#
# Parameters:
#   env          - Environment: "prod" or "black"
#   store_target - Target store: "chrome", "edge", "firefox", etc.
#   beta         - Optional: "true" for beta build, defaults to "false"
function bundle_extension {
    local store_target="$1"
    local env="$2"
    local beta="${3:-false}"

    local outputs=()

    # Derive build command from $env
    local cmd="build:extension"
    [ "$env" = "black" ] && cmd="build:extension:dev"

    # Derive BUILD_TARGET from $store_target
    local target="$store_target"
    [ "$store_target" = "edge" ] && target="chrome"

    local display="$store_target"
    [ "$beta" = "true" ] && display="$display:beta"
    display="$display ($env)"

    local env_vars=("BUILD_TARGET=$target" "MANIFEST_KEY=\"\"" "BUILD_STORE_TARGET=$store_target")
    [ "$beta" = "true" ] && env_vars+=("BETA=true")
    [ "$env" = "prod" ] && env_vars+=("RELEASE=true")

    on_enter "$display"

    for var in "${env_vars[@]}"; do
        printf "\t%s\n" "$var"
    done

    eval "${env_vars[*]} yarn run $cmd >/dev/null"
    cd dist

    local suffix=""
    local name="$store_target"

    [ "$env" = "black" ] && suffix=".black"
    [ "$beta" = "true" ] && suffix="-beta$suffix"
    [ "$beta" = "true" ] && name="$name-beta"

    # Build final release for production
    [ "$env" = "prod" ] && zip -rqX "$ARTEFACTSDIR/release/$BUILD_ID-$name.zip" . && outputs+=("release/$BUILD_ID-$name.zip")

    # Staging QA Build - set manifest key for chromium builds
    [ "$store_target" != "firefox" ] && set_manifest_key "./manifest.json" "$store_target:$([ "$beta" = "true" ] && echo "beta" || echo "production")"
    zip -rqX "$ARTEFACTSDIR/$store_target/$BUILD_ID$suffix.zip" . && outputs+=("$store_target/$BUILD_ID$suffix.zip")

    on_leave "${outputs[@]}"
}

# Bundle extension from sources
# Usage: bundle_extension_from_sources <build_target>
#
# Parameters:
#   build_target - Target platform (typically "firefox")
function bundle_extension_from_sources {
    local build_target="$1"

    on_enter "$1 (sources)"
    BUILD_TARGET=$1 NODE_ENV=production yarn run config >/dev/null
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

    on_enter "$1 (prod)"
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
echo "Building extensions... This may take a while."
printf "\tNode\t%s (%s)\n" "$(node --version)" "$(which node)"
printf "\tnpm\tv%s (%s)\n" "$(npm --version)" "$(which npm)"
printf "\tYarn\tv%s (%s)\n" "$(yarn --version)" "$(which yarn)"

for var in "REPODIR" "PASSDIR" "VERSION" "ARTEFACTSDIR" "OUTDIR" "COMMIT" "BUILD_ID"; do
    printf "\t%s = %s\n" "${var}" "${!var}"
done

# Validate dependencies
echo -e "\nValidating yarn.lock..."
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
mkdir -p "$ARTEFACTSDIR/release"

# NOTE: last build needs to contain sourcemaps
# for i18n extraction in the CI

if [[ "${1-}" == "--beta" ]]; then
    # Chrome store BETA builds
    bundle_extension chrome prod true
    bundle_extension chrome black true
else
    # Firefox builds
    bundle_extension firefox black
    bundle_extension_from_sources firefox

    # Microsoft store builds
    bundle_extension edge prod
    bundle_extension edge black

    # Chrome store builds
    bundle_extension chrome prod
    bundle_extension chrome black
fi
