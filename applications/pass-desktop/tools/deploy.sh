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

if [ "$1" = "windows" ]; then
  subpath="PassDesktop/win32/x64"
  executable_filename="ProtonPass_Setup_${TAG_VERSION}.exe"
elif [ "$1" = "macos" ]; then
  subpath="PassDesktop/darwin/universal"
  executable_filename="ProtonPass_${TAG_VERSION}.dmg"
elif [ "$1" = "linux" ]; then
  subpath="PassDesktop/linux/x64"
  executable_filename="ProtonPass_${TAG_VERSION}.deb"
  executable_filename_rpm="ProtonPass_${TAG_VERSION}.rpm"
else
  echo "Invalid argument provided (must be 'windows', 'macos' or 'linux')"
  exit 1
fi
path="${repoDir}/${subpath}"

# Configure git
git config --local user.name "${GIT_COMMIT_AUTHOR}"
git config --local user.email "${GIT_COMMIT_EMAIL}"

mkdir -p "${path}"
# Copy artefacts
if [ "$1" = "windows" ]; then
  if [[ "${CATEGORY}" == "Stable" ]]; then
    cp "${PROJECT_ROOT}/out/make/squirrel.windows/x64/"* "${path}/"
    cp "${PROJECT_ROOT}/out/make/squirrel.windows/x64/ProtonPass_Setup_${VERSION}.exe" "${path}/ProtonPass_Setup.exe"
  else
    cp "${PROJECT_ROOT}/out/make/squirrel.windows/x64/ProtonPass_Setup_${VERSION}.exe" "${path}/${executable_filename}"
  fi
  git lfs track "*.exe" "*.nupkg"
elif [ "$1" = "macos" ]; then
  cp "${PROJECT_ROOT}/out/make/Proton Pass.dmg" "${path}/${executable_filename}"
  if [[ "${CATEGORY}" == "Stable" ]]; then
    cp "${PROJECT_ROOT}/out/make/Proton Pass.dmg" "${path}/ProtonPass.dmg"
    # RELEASES.json follows the format detailed here: https://github.com/Squirrel/Squirrel.Mac#update-file-json-format
    cp "${PROJECT_ROOT}/out/make/zip/darwin/universal/RELEASES.json" "${path}/RELEASES.json"
    # zip file name must match what is defined in RELEASES.json
    cp "${PROJECT_ROOT}/out/make/zip/darwin/universal/Proton Pass-darwin-universal-${VERSION}.zip" "${path}/Proton Pass-darwin-universal-${VERSION}.zip"
  fi
  git lfs track "*.dmg" "PassDesktop/**/*.zip"
elif [ "$1" = "linux" ]; then
  cp "${PROJECT_ROOT}/out/make/deb/x64/proton-pass_${VERSION}_amd64.deb" "${path}/${executable_filename}"
  cp "${PROJECT_ROOT}/out/make/rpm/x64/proton-pass-${TAG_VERSION}-1.x86_64.rpm" "${path}/${executable_filename_rpm}"
  if [[ "${CATEGORY}" == "Stable" ]]; then
    cp "${PROJECT_ROOT}/out/make/deb/x64/proton-pass_${VERSION}_amd64.deb" "${path}/ProtonPass.deb"
    cp "${PROJECT_ROOT}/out/make/rpm/x64/proton-pass-${TAG_VERSION}-1.x86_64.rpm" "${path}/ProtonPass.rpm"
  fi
  git lfs track "*.deb" "*.rpm"
fi

# Update version.json
now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sha=$(sha512sum "${path}/${executable_filename}" | cut -d " " -f 1)
if [ "$1" = "linux" ]; then
  sha_rpm=$(sha512sum "${path}/${executable_filename_rpm}" | cut -d " " -f 1)
fi

if [ ! -f "${path}/version.json" ]; then
  echo "{\"Releases\": []}" > "${path}/version.json"
fi

# Exit if this same version already exists
if grep -q "$sha" "${path}/version.json"; then
  echo "SHA already exists in version.json"
  exit 1
fi
if jq -e ".Releases[] | select(.Version == \"${TAG_VERSION}\")" "${path}/version.json"; then
  echo "Version ${TAG_VERSION} already exists in version.json"
  exit 1
fi

if [ "$1" = "linux" ]; then
  file="[
    { \"Url\": \"https://proton.me/download/${subpath}/${executable_filename}\", \"Sha512CheckSum\": \"${sha}\", \"Identifier\": \".deb (Ubuntu/Debian)\" },
    { \"Url\": \"https://proton.me/download/${subpath}/${executable_filename_rpm}\", \"Sha512CheckSum\": \"${sha_rpm}\", \"Identifier\": \".rpm (Fedora/RHEL)\" }
  ]"
else
  file="[{ \"Url\": \"https://proton.me/download/${subpath}/${executable_filename}\", \"Sha512CheckSum\": \"${sha}\", \"Args\": \"\" }]"
fi

newrelease="{\"CategoryName\":\"${CATEGORY}\", \"Version\": \"${TAG_VERSION}\", \"ReleaseDate\": \"${now}\", \"RolloutPercentage\": 0, \"File\": ${file}}"
< "${repoDir}/${subpath}/version.json" jq ".Releases |= [$newrelease] + ." > version.json.tmp
mv version.json.tmp "${repoDir}/${subpath}/version.json"

cat "${path}/version.json"
if [ "$1" = "macos" ]; then
  cat "${path}/RELEASES.json"
fi

# Commit and push
git add .
git status
git commit -m "Pass Desktop ${TAG_VERSION} $1"
git push -u origin deploy

popd
rm -rf "$repoDir"
