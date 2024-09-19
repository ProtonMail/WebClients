#!/usr/bin/env sh
set -euo

echoerr() { echo "$@" 1>&2; }

CWD=$(pwd)
BUILD_DIR="applications/pass-desktop/out/make"
PLATFORM="$1"

# Deployment is EarlyAccess if its CI tag contains a dash, eg. proton-pass@1.0.0-rc1
TAG_VERSION="${CI_COMMIT_TAG:-}"
TAG_VERSION="${TAG_VERSION##*@}"
if [ -n "${TAG_VERSION}" ] && [ "${TAG_VERSION#*-}" = "${TAG_VERSION}" ]; then
  CHANNEL="Stable"
else
  CHANNEL="EarlyAccess"
fi

# Currently, we're only supporting the stable channel
if [ "$CHANNEL" != "Stable" ]; then
  echoerr "Channels other than 'Stable' are currently unsupported (v=${TAG_VERSION},c=${CHANNEL})"
  exit 1
fi

# Copy artefacts
cd "$BUILD_DIR"
if [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "windows" ]; then
  cp ./*.exe "ProtonPass_Setup.exe"
elif [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "linux" ]; then
  cp ./rpm/x64/*.rpm "ProtonPass.rpm"
  cp ./deb/x64/*.deb "ProtonPass.deb"
elif [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "macos" ]; then
  cp ./*.dmg "ProtonPass.dmg"
fi

cd "$CWD"
if [ "$CHANNEL" = "Stable" ]; then
  find "$BUILD_DIR" -type f > artifact.list
fi

printf "PASS_RELEASE_CHANNEL=%s\nPASS_RELEASE_PLATFORM=%s" "$CHANNEL" "$PLATFORM" > deploy.env
