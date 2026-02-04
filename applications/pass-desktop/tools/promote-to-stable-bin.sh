#!/usr/bin/env sh
set -eu

echoerr() { echo "$@" 1>&2; }

CWD=$(pwd)
PLATFORM="$1"

. "${CWD}/applications/pass-desktop/tools/helpers/current-version.sh"

VERSION=$(get_current_version)

# We don't want proxy to download directly from s3
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

# Define files to promote per platform (source:target pairs)
case "$PLATFORM" in
    macos)
        FILES="ProtonPass_${VERSION}.dmg:ProtonPass.dmg"
        ;;
    windows)
        FILES="ProtonPass_Setup_${VERSION}.exe:ProtonPass_Setup.exe"
        ;;
    linux)
        FILES="proton-pass_${VERSION}_amd64.deb:proton-pass_amd64.deb proton-pass-${VERSION}-1.x86_64.rpm:proton-pass-1.x86_64.rpm"
        ;;
    *)
        echoerr "Error: Unknown platform '${PLATFORM}'"
        echoerr "Supported platforms: macos, windows, linux"
        exit 1
        ;;
esac

# Process each file: download and rename
> artifact.list  # Clear artifact list

for file_pair in $FILES; do
    SOURCE_FILE="${file_pair%%:*}"
    TARGET_FILE="${file_pair#*:}"

    # Download from S3
    URL="${AL_S3_BASE_URL}/devops:pass-releases/${PLATFORM}/${SOURCE_FILE}"
    echo "Downloading ${URL}"
    wget "${URL}"

    # Rename to stable version
    echo "Renaming ${SOURCE_FILE} to ${TARGET_FILE}"
    mv "${SOURCE_FILE}" "${TARGET_FILE}"

    # Add to artifact list
    echo "${TARGET_FILE}" >> artifact.list
done

# Log artifacts
echo "\nartifact.list:"
cat artifact.list
