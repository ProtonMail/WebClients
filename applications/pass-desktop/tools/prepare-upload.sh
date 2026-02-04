#!/usr/bin/env sh
set -eu

echoerr() { echo "$@" 1>&2; }

CWD=$(pwd)
BUILD_DIR="applications/pass-desktop/out/make"
PLATFORM="$1"

# Extract version from CI tag and validate it's a stable release (no dash)
TAG_VERSION="${CI_COMMIT_TAG:-}"
TAG_VERSION="${TAG_VERSION##*@}"

# Exit if no tag version is found
if [ -z "${TAG_VERSION}" ]; then
  echoerr "Invalid or missing tag version (v=${TAG_VERSION})"
  exit 1
fi

# Todo remove
# Strip test suffix for testing purposes (eg. 1.0.0-test1 -> 1.0.0)
# The point is to accept versions with this particular format to be able to test upload
if [ "${TAG_VERSION#*-test}" != "${TAG_VERSION}" ]; then
  TAG_VERSION="${TAG_VERSION%%-test*}"
fi

# Exit if version contains a dash (eg. proton-pass@1.0.0-rc1)
if [ "${TAG_VERSION#*-}" != "${TAG_VERSION}" ]; then
  echoerr "Invalid tag version. Expected stable version without dash (v=${TAG_VERSION})"
  exit 1
fi

echo "Processing for tag ${CI_COMMIT_TAG}"

# Log build dir content
cd "$BUILD_DIR"
echo "\nbuild dir:"
ls -l . | grep -v '^total'

# Populate `artifact.list` file which will be the reference for the actual upload
cd "$CWD"
find "$BUILD_DIR" -type f ! -name RELEASES ! -name RELEASES.json > artifact.list

# Log artifacts
echo "\nartifact.list:"
cat artifact.list
