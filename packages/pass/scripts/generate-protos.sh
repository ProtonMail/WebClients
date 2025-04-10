#!/usr/bin/env bash

set -euxo pipefail

# Detect OS type to handle sed differences between macOS and Linux
unameOutput="$(uname -s)"
case "${unameOutput}" in
Linux*) os="linux" ;;
Darwin*) os="macos" ;;
*)
    echo "Unsupported machine"
    exit 1
    ;;
esac
echo ${os}

# Set up directory paths
SCRIPT_DIR=$(dirname "$0")
ROOT_DIR="$SCRIPT_DIR/.."
PLUGIN_DIR="$ROOT_DIR"/../../node_modules/@protobuf-ts/plugin/bin/protoc-gen-ts
OUT_DIR="$ROOT_DIR"/types/protobuf

# OS-specific sed function that handles different flags for macOS vs Linux
function os_sed() {
    local pattern="$1"
    local file="$2"

    if [[ $os == "linux" ]]; then
        sed -i -E "$pattern" "$file"
    elif [[ $os == "macos" ]]; then
        sed -i '' -E "$pattern" "$file"
    fi
}

function process_file() {
    f="$1"
    # Generate TypeScript bindings from proto file
    npx protoc --plugin="${PLUGIN_DIR}" --ts_out "eslint_disable:${OUT_DIR}" --proto_path "$ROOT_DIR"/types/protobuf/protos "${f}"

    # Determine file paths for generated TypeScript files
    GENERATED_FILE_NAME=$(basename "${f}" | sed 's:proto:ts:g')
    GENERATED_FILE_PATH="${OUT_DIR}/${GENERATED_FILE_NAME}"
    STATIC_FILE_NAME=$(basename "${f}" | sed 's:proto:static.ts:g')
    STATIC_FILE_PATH="${OUT_DIR}/${STATIC_FILE_NAME}"

    # Enum extraction
    if grep -q "export enum" "${GENERATED_FILE_PATH}"; then
        echo "/* eslint-disable */" >"${STATIC_FILE_PATH}"

        ENUM_NAMES=$(awk '/export enum/ { print $3 }' "${GENERATED_FILE_PATH}" | tr '\n' ',' | sed 's/,$//')
        awk '/export enum/ { flag=1; print; next } /^}$/ { if (flag) { print; flag=0; print "" } } flag' "${GENERATED_FILE_PATH}" >>"${STATIC_FILE_PATH}"

        # Remove all enum definitions from the original file and import instead
        os_sed '/export enum/,/^}/d' "${GENERATED_FILE_PATH}"
        os_sed '4a\
        import { '"${ENUM_NAMES}"' } from '"'./${STATIC_FILE_NAME%.ts}';"'' "${GENERATED_FILE_PATH}"

        npx prettier --write "${GENERATED_FILE_PATH}" "${STATIC_FILE_PATH}"
    else
        # If no enums exist, just format the generated file
        npx prettier --write "${GENERATED_FILE_PATH}"
    fi
}

# Process each proto file in the directory
for f in "$ROOT_DIR"/types/protobuf/protos/*.proto; do
    process_file "$f"
done
