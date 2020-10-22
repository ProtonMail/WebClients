#!/usr/bin/env bash
set -eo pipefail

TAG='';
BRANCH='';
COMMIT='';
BUILD_MODE='bundle';
OUTPUT_FILE='build/assets/version.json';
IS_DEBUG=false;

while [ ! $# -eq 0 ]; do
  case "$1" in
    --tag) TAG="$2"; ;;
    --branch) BRANCH="$2"; ;;
    --commit) COMMIT="$2"; ;;
    --output) OUTPUT_FILE="$2"; ;;
    --build-mode) BUILD_MODE="$2"; ;;
    --debug) IS_DEBUG=true; ;;
    --verbose) IS_DEBUG=true; ;;
  esac
  shift
done;

OUTPUT_DIR="$(dirname "$OUTPUT_FILE")";

function getVersion {

    if [ -n "$TAG" ]; then
        echo "$TAG";
        return 0;
    fi;

    # Sadly MacOS doesn't have gawk but awk, which doesn't support this match :/
    # awk 'match($0, /"version": "([0-9]+\.[0-9]+\.[0-9]+)"/, arr) { print arr[1]; }'
    # Filter via grep because we have a custom AB version sript inside version
    local version=$(cat package.json | awk '/"version": "(.+)"/{print $2}' | sed 's/"//g;s/,//g' | grep -E '[0-9].+');
    echo "$version";
}

function getCommit {
    if [ -n "$COMMIT" ]; then
        echo "$COMMIT";
        return 0;
    fi;

    git rev-parse HEAD;
}

function getVersionDep {
  # sadly jq is not available everywhere, nor gawk so we take the first entry (as we can have more than 1 inside the lock...)
  if ! command -v jq &> /dev/null; then
    grep -E "version.+$1#" package-lock.json | awk -F '#' '{print $2}' | sed 's/",//' | head -1 || echo '';
    return 0
  fi

  local version="$(jq -r  ".dependencies[\"$1\"].version" package-lock.json || jq -r  ".dependencies[\"$1\"].version" package-lock.json || echo '')"
  echo "$version" | awk -F '#' '{print $2}'
}

function getBranch {

    # Prevent weird branch's name on gitlab or HEAD
    if [ -n "$CI_COMMIT_REF_NAME" ]; then
        echo "$CI_COMMIT_REF_NAME";
        return 0;
    fi;

    if [ -n "$BRANCH" ]; then
        echo "$BRANCH";
        return 0;
    fi;

    git describe --all;
}

function getRelease {
    echo "$(getBranch)-$(getVersion)-$(git log -n 1 --format=%h)";
}
function getLocales {
    if [ -d "node_modules/proton-translations" ]; then
        cat node_modules/proton-translations/.version || echo;
    fi
}

function toJSON {
    local commit=$(getCommit);
    local version=$(getVersion);
    local branch=$(getBranch);
    local buildDate="$(date -u '+%FT%TZ')";
    local release="$(getRelease)";
    local locales="$(getLocales)";
    local depProtonTranslations="$(getVersionDep 'proton-translations')";
    local depReactComponents="$(getVersionDep 'react-components')";
    local depProtonShared="$(getVersionDep 'proton-shared')";
    local depPmcrypto="$(getVersionDep 'pmcrypto')";
    local depDesignSystem="$(getVersionDep 'design-system')";

cat <<EOT
{
    "version": "${version}",
    "commit": "${commit}",
    "branch": "${branch}",
    "buildDate": "${buildDate}",
    "release": "${release}",
    "buildMode": "${BUILD_MODE}",
    "locales": "${locales}",
    "dependencies": {
        "proton-translations": "${depProtonTranslations}",
        "react-components": "${depReactComponents}",
        "proton-shared": "${depProtonShared}",
        "design-system": "${depDesignSystem}",
        "pmcrypto": "${depPmcrypto}"
    }
}
EOT
}


if ! [ -d "$OUTPUT_DIR" ]; then
    mkdir -p "$OUTPUT_DIR";
fi;

printf '%-20s' "[TAG]" "$TAG";
echo
printf '%-20s' "[BRANCH]" "$BRANCH";
echo
printf '%-20s' "[BUILD_MODE]" "$BUILD_MODE";
echo
printf '%-20s' "[COMMIT]" "$COMMIT";
echo
printf '%-20s' "[OUTPUT_FILE]" "$OUTPUT_FILE";
echo

##
#  Write JSON version inside assets
toJSON > "$OUTPUT_FILE";

if $IS_DEBUG; then
    cat "$OUTPUT_FILE";
fi;

