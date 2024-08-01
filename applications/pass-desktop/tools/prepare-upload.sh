#!/usr/bin/env sh
set -euo

CWD=$(pwd)
BUILD_DIR="applications/pass-desktop/out/make"
PLATFORM="$1"

# Deployment is EarlyAccess if its CI tag contains a dash, eg. 1.0.0-rc1
if [ -n "${CI_COMMIT_TAG:-}" ] && [ "${CI_COMMIT_TAG#*-}" = "$CI_COMMIT_TAG" ]; then
  CHANNEL="Stable"
else
  CHANNEL="EarlyAccess"
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
else
  # Omit RELEASES and RELEASES.json on non-stable deploys
  find "$BUILD_DIR" -type f ! -name "RELEASES*" > artifact.list
fi

printf "PASS_RELEASE_CHANNEL=%s\nPASS_RELEASE_PLATFORM=%s" "$CHANNEL" "$PLATFORM" > deploy.env
