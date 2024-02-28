#!/bin/bash
set -euo pipefail

if [ -z "${CI_COMMIT_TAG}" ]; then
  echo "CI_COMMIT_TAG is not set."
  exit 1
fi

if [ -z "${PASS_DESKTOP_DEPLOY_REPO}" ]; then
  echo "PASS_DESKTOP_DEPLOY_REPO is not set."
  exit 1
fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="${SCRIPT_DIR//\/tools/}"
GIT_COMMIT_AUTHOR="${GITLAB_USER_NAME}"
GIT_COMMIT_EMAIL="${GITLAB_USER_EMAIL}"
VERSION="$(jq -r .version < "$PROJECT_ROOT/package.json")"
# shellcheck disable=SC2001
TAG_VERSION=$( echo "$CI_COMMIT_TAG" | sed 's/.*@//' )

# Deployment is EarlyAccess if its version contains a dash, eg. 1.0.0-rc1
CATEGORY="Stable"
if [[ "${TAG_VERSION}" == *"-"* ]]; then
  CATEGORY="EarlyAccess"
fi

# Check if git-lfs is available (or auto-install it under CI)
if ! command -v git-lfs --help &> /dev/null; then
  echo "[!!] Git LFS not installed"

  if [ -n "$CI" ]; then
    echo "Attempting to install..."
    apt update && apt install -y git-lfs
  else
    exit 1
  fi
fi

# Clone the download repo to a temporary directory
repoDir=$(mktemp -d)
git clone --depth 1 "${PASS_DESKTOP_DEPLOY_REPO}" "$repoDir"
pushd "$repoDir" || exit 1

# Configure git
git config --local user.name "${GIT_COMMIT_AUTHOR}"
git config --local user.email "${GIT_COMMIT_EMAIL}"

# Copy Windows artefacts
mkdir -p "${repoDir}/PassDesktop/win32/x64"
cp "${PROJECT_ROOT}/out/make/squirrel.windows/x64/"* "${repoDir}/PassDesktop/win32/x64/"
if [[ "${CATEGORY}" == "Stable" ]]; then
  cp "${PROJECT_ROOT}/out/make/squirrel.windows/x64/ProtonPass_Setup_${VERSION}.exe" "${repoDir}/PassDesktop/win32/x64/ProtonPass_Setup.exe"
fi
git lfs track "*.exe" "*.nupkg"

# Update version.json
now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sha=$(sha512sum "${repoDir}/PassDesktop/win32/x64/ProtonPass_Setup_${VERSION}.exe" | cut -d " " -f 1)
if [ ! -f "${repoDir}/PassDesktop/win32/x64/version.json" ]; then
  echo "{\"Releases\": []}" > "${repoDir}/PassDesktop/win32/x64/version.json"
fi

if grep -q "$sha" "${repoDir}/PassDesktop/win32/x64/version.json"; then
  echo "SHA already exists in version.json"
  exit 1
fi
newrelease="{\"CategoryName\":\"${CATEGORY}\", \"Version\": \"${VERSION}\", \"ReleaseDate\": \"${now}\", \"RolloutPercentage\": 0, \"File\": { \"Url\": \"https://proton.me/download/PassDesktop/win32/x64/ProtonPass_Setup_${VERSION}.exe\", \"Sha512CheckSum\": \"${sha}\", \"Args\": \"\" }}"
< "${repoDir}/PassDesktop/win32/x64/version.json" jq ".Releases |= [$newrelease] + ." > version.json.tmp
mv version.json.tmp "${repoDir}/PassDesktop/win32/x64/version.json"

cat "${repoDir}/PassDesktop/win32/x64/version.json"

# Commit and push
git add .
git status
git commit -m "Pass Desktop ${VERSION}"
git push -u origin deploy

popd
rm -rf "$repoDir"
