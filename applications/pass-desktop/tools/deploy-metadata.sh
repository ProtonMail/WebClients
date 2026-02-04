#!/usr/bin/env sh
set -eu

CWD=$(pwd)
PLATFORM="$1"
BRANCH_NAME="release/${PLATFORM}-${VERSION}-beta"

. "${CWD}/applications/pass-desktop/tools/helpers/current-version.sh"
. "${CWD}/applications/pass-desktop/tools/helpers/git-metadata.sh"

VERSION=$(get_current_version)

# Setup metadata repository
METADATA_REPO=$(setup_metadata_repo)
cd "$METADATA_REPO"

# Update metadata
python3 "${CWD}/applications/pass-desktop/tools/update-metadata.py" "$PLATFORM"

# Copy over RELEASES, initially to BETA feed, copy to RELEASE will be made manually afterward
if [ "$PLATFORM" = "windows" ]; then
  cp "$CWD/applications/pass-desktop/out/make/squirrel.windows/x64/RELEASES" "assets/windows/beta/RELEASES"
elif [ "$PLATFORM" = "macos" ]; then
  cp "$CWD/applications/pass-desktop/out/make/zip/darwin/universal/RELEASES.json" "assets/macos/beta/RELEASES.json"
fi

# Commit and push with MR
commit_and_push_mr "$BRANCH_NAME" "Pass Desktop ${VERSION} (${PLATFORM}) Beta"
