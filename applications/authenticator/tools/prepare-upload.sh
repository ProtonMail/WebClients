#!/usr/bin/env sh
set -euo

echoerr() { echo "$@" 1>&2; }

CWD=$(pwd)
PLATFORM="$1"
SCRIPT_ROOT=$(dirname "$(realpath "$0")")
APP_ROOT=$(dirname "${SCRIPT_ROOT}")
APP_ID=$(basename "${APP_ROOT}")
VERSION=$(grep 'version = ' -m 1 "${APP_ROOT}/src-tauri/Cargo.toml" | sed 's/.*"\(.*\)".*/\1/')
BUILD_DIR="${APP_ROOT}/src-tauri/target/release/bundle"
CHANNEL="Stable" # Currently, we're only supporting the stable channel

if [ "$CHANNEL" != "Stable" ]; then
  echoerr "Channels other than 'Stable' are currently unsupported (v=${TAG_VERSION},c=${CHANNEL})"
  exit 1
fi

# Copy latest artefacts for easy-access / stable URLs
cd "$BUILD_DIR"
if [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "windows" ]; then
  cp ./msi/*.msi "ProtonAuthenticator_Setup.msi"
elif [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "linux" ]; then
  cp ./rpm/*.rpm "ProtonAuthenticator.rpm"
  cp ./deb/*.deb "ProtonAuthenticator.deb"
  cp ./appimage/*.AppImage "ProtonAuthenticator.AppImage"
elif [ "$CHANNEL" = "Stable" ] && [ "$PLATFORM" = "macos" ]; then
  cp ./dmg/*.dmg "ProtonAuthenticator.dmg"
fi
cd "$CWD"

# Build artifact.list
find "$BUILD_DIR" \
  -maxdepth 2 \
  -type f \
  -name '*.dmg' \
  -o -name '*.msi' \
  -o -name '*.msi.sig' \
  -o -name '*.rpm' \
  -o -name '*.rpm.sig' \
  -o -name '*.deb' \
  -o -name '*.deb.sig' \
  -o -name '*.AppImage' \
  -o -name '*.AppImage.sig' | tee artifact.list

printf "IDTEAM_DESKTOP_APP_ID=%s\nIDTEAM_DESKTOP_VERSION=%s\nIDTEAM_DESKTOP_CHANNEL=%s\nIDTEAM_DESKTOP_PLATFORM=%s" "$APP_ID" "$VERSION" "$CHANNEL" "$PLATFORM" | tee deploy.env
