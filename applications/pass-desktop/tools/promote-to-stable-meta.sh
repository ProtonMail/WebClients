#!/usr/bin/env sh
set -eu

CWD=$(pwd)

. "${CWD}/applications/pass-desktop/tools/helpers/current-version.sh"
. "${CWD}/applications/pass-desktop/tools/helpers/git-metadata.sh"

VERSION=$(get_current_version)
BRANCH_NAME="release/${VERSION}-stable"

# Setup metadata repository
METADATA_REPO=$(setup_metadata_repo)
cd "$METADATA_REPO"

# copy release files
cp "${METADATA_REPO}/assets/windows/beta/RELEASES" "${METADATA_REPO}/assets/windows"
cp "${METADATA_REPO}/assets/macos/beta/RELEASES.json" "${METADATA_REPO}/assets/macos"

# update version.json - promote matching version from Beta to Stable with 5% rollout
for platform in windows macos linux; do
    VERSION_JSON="${METADATA_REPO}/assets/${platform}/version.json"

    if [ -f "$VERSION_JSON" ]; then
        echo "Updating ${platform}/version.json: promoting version ${VERSION} to Stable (5% rollout)"
        jq --arg version "$VERSION" \
            '.Releases |= map(if .Version == $version then . + {CategoryName: "Stable", RolloutPercentage: 0.05} else . end)' \
            "$VERSION_JSON" > "${VERSION_JSON}.tmp"
        mv "${VERSION_JSON}.tmp" "$VERSION_JSON"
    fi
done

# Commit and push with MR
commit_and_push_mr "$BRANCH_NAME" "Pass Desktop ${VERSION} Stable"
