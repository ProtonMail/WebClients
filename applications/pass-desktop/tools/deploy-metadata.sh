#!/usr/bin/env sh
set -euo

if [ -z "${PASS_DESKTOP_METADATA_REPO}" ]; then
  echo "PASS_DESKTOP_METADATA_REPO is not set."
  exit 1
fi

PLATFORM="$PASS_RELEASE_PLATFORM"
CHANNEL="$PASS_RELEASE_CHANNEL"
VERSION=$(grep version applications/pass-desktop/package.json | sed 's/.*"version": "\(.*\)".*/\1/')
CWD=$(pwd)
GIT_COMMIT_AUTHOR="${GITLAB_USER_NAME}"
GIT_COMMIT_EMAIL="${GITLAB_USER_EMAIL}"
METADATA_REPO=$(mktemp -d)
BRANCH_NAME="release/${PLATFORM}-${VERSION}-${CHANNEL}"

# Clone existing metadata
git clone --depth 1 "${PASS_DESKTOP_METADATA_REPO}" "$METADATA_REPO"

# Configure git
cd "$METADATA_REPO"
git config --local user.name "${GIT_COMMIT_AUTHOR}"
git config --local user.email "${GIT_COMMIT_EMAIL}"

# Update metadata
python3 "${CWD}/applications/pass-desktop/tools/update-metadata.py" "$PLATFORM" "$CHANNEL"

# Deploy metadata
git checkout -b "$BRANCH_NAME"
git add .
git status
git commit -m "Pass Desktop ${VERSION} (${PLATFORM}, ${CHANNEL})"
git push -u origin "$BRANCH_NAME" -o merge_request.create -o merge_request.target=main -o merge_request.remove_source_branch
