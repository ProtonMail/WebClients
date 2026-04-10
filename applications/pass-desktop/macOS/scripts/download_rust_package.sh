#!/bin/bash

set -e

export PATH="/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(dirname "$0")"

# Get VERSION & HASH variables from .rust-package file
source "${SCRIPT_DIR}/../.rust-package"

TMP_DIR_PATH="${SCRIPT_DIR}/../../tmp"
LOCAL_PACKAGE_PATH="$SCRIPT_DIR/../Packages/PassRustCore"

URL="https://github.com/protonpass/proton-pass-common/releases/download/${VERSION}/PassRustCode.swift.zip"

if ! command -v wget &> /dev/null; then
    echo "wget is not installed, installing via Homebrew"
    brew install wget
fi

# Check if the current local package is using the right version
LOCAL_VERSION_PATH="${LOCAL_PACKAGE_PATH}/VERSION"
if [ -e "$LOCAL_VERSION_PATH" ]; then
    LOCAL_VERSION=$(cat $LOCAL_VERSION_PATH)
    if [ "$VERSION" = "$LOCAL_VERSION" ]; then
        echo "Correct local Rust package version $LOCAL_VERSION. Skipped download."
        true
        exit 0
    else
        echo "Not matched local Rust package version $LOCAL_VERSION, getting the right one $VERSION."
    fi
else
    echo "No local package found. Downdoading Rust package version $VERSION..."
fi

echo "Creating tmp directory if not exist"
mkdir -p $TMP_DIR_PATH

echo -e "Downloading artifact\n"
wget -q --progress=bar:force -N -P $TMP_DIR_PATH $URL

ARTIFACT_PATH="${TMP_DIR_PATH}/PassRustCode.swift.zip"

echo "Checksum verification for artifact"
echo -n "${HASH}  ${ARTIFACT_PATH}" | shasum -a 256 -c

echo -e "\nUnzipping artifact"
unzip -o $ARTIFACT_PATH -d $TMP_DIR_PATH

rm -rf $LOCAL_PACKAGE_PATH
mkdir $LOCAL_PACKAGE_PATH

UNZIPPED_PACKAGE_PATH="${TMP_DIR_PATH}/builds/proton/clients/pass/proton-pass-common/proton-pass-mobile/iOS/PassRustCore/*"

echo -e "\nCopying unzipped package to local package directory"
mv -f $UNZIPPED_PACKAGE_PATH $LOCAL_PACKAGE_PATH

echo "Removing tmp directory"
rm -rf $TMP_DIR_PATH

echo "Done! You may need to restart Xcode and clean build folder if you encounter building issues."