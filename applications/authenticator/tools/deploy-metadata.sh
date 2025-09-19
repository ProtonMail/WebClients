#!/usr/bin/env sh
set -euo

# Passed from Gitlab repository's CI env vars
if [ -z "${PASS_DESKTOP_METADATA_REPO}" ]; then
  echo "PASS_DESKTOP_METADATA_REPO is not set."
  exit 1
fi

# Passed from prepare-upload.sh
PLATFORM="${IDTEAM_DESKTOP_PLATFORM}"
CHANNEL="${IDTEAM_DESKTOP_CHANNEL}"
VERSION="${IDTEAM_DESKTOP_VERSION}"
APP_ID="${IDTEAM_DESKTOP_APP_ID}"

CWD=$(pwd)

if [ -z "${IDTEAM_DESKTOP_PLATFORM}" ] || [ -z "${IDTEAM_DESKTOP_CHANNEL}" ] || [ -z "${IDTEAM_DESKTOP_VERSION}" ] || [ -z "${IDTEAM_DESKTOP_APP_ID}" ]; then
  echo "One or more IDTEAM_ variables is not set."
  exit 1
fi

GIT_COMMIT_AUTHOR="${GITLAB_USER_NAME}"
GIT_COMMIT_EMAIL="${GITLAB_USER_EMAIL}"
METADATA_REPO=$(mktemp -d)
BRANCH_NAME="release/${APP_ID}-${PLATFORM}-${VERSION}-${CHANNEL}"

# Clone existing metadata
git clone --depth 1 "${PASS_DESKTOP_METADATA_REPO}" "${METADATA_REPO}"

# Configure git
cd "$METADATA_REPO"
git config --local user.name "${GIT_COMMIT_AUTHOR}"
git config --local user.email "${GIT_COMMIT_EMAIL}"

# Update metadata
python3 "${CWD}/applications/${APP_ID}/tools/update-metadata.py" "$PLATFORM" "$CHANNEL" "$VERSION"

# Deploy metadata
git checkout -b "$BRANCH_NAME"
git add .
git status
git commit -m "${APP_ID} ${VERSION} (${PLATFORM}, ${CHANNEL})"
git push -u origin "$BRANCH_NAME" -o merge_request.create -o merge_request.target=main -o merge_request.remove_source_branch
