#!/usr/bin/env sh
set -euo pipefail

KEYCHAIN_NAME="$PASS_MACOS_KEYCHAIN_NAME"
KEYCHAIN_PASSWORD="$PASS_MACOS_KEYCHAIN_PASSWORD"
SECURE_FILES_PATH="./.secure_files"

# Download secure files
glab auth login --job-token $CI_JOB_TOKEN --hostname $CI_SERVER_FQDN --api-protocol $CI_SERVER_PROTOCOL
glab -R $CI_PROJECT_PATH securefile download --all --output-dir="$SECURE_FILES_PATH"

P12_FILE="$SECURE_FILES_PATH/Pass_Macos_Developer_id_application.p12"

# Ensure secure files are cleaned up on exit
trap "rm -rf '$SECURE_FILES_PATH'" EXIT

# Create a temporary keychain
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

# Set it to NOT lock automatically during the build
security set-keychain-settings -t 3600 -u "$KEYCHAIN_NAME"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

# Import the signing certificate
# -T: allows the specified application to access the key without a prompt
security import "$P12_FILE" -k "$KEYCHAIN_NAME" -P "$PASS_MACOS_CERT_PASSWORD" -T /usr/bin/codesign

# This prevents the "User interaction is not allowed" error by pre-authorizing the codesign tool
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

# Add Keychain to Search List
# This ensures the 'codesign' tool can find the new certificate
security list-keychains -d user -s "$KEYCHAIN_NAME" $(security list-keychains -d user | xargs)