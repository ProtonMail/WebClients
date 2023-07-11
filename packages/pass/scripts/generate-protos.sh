#!/usr/bin/env bash

set -euxo pipefail

unameOutput="$(uname -s)"
case "${unameOutput}" in
    Linux*)     os="linux";;
    Darwin*)    os="macos";;
    *)          echo "Unsupported machine"; exit 1;;
esac
echo ${os}


SCRIPT_DIR=$(dirname "$0")
ROOT_DIR="$SCRIPT_DIR/.."
PLUGIN_DIR="$ROOT_DIR"/../../node_modules/.bin/protoc-gen-ts
OUT_DIR="$ROOT_DIR"/types/protobuf

function process_file() {
    f="$1"
    # Generate bindings for file
    npx protoc --plugin="${PLUGIN_DIR}" --ts_out "${OUT_DIR}" --proto_path "$ROOT_DIR"/protos "${f}"

    # Obtain generated .ts name
    GENERATED_FILE_NAME=$(basename "${f}" | sed 's:proto:ts:g')
    GENERATED_FILE_PATH="${OUT_DIR}/${GENERATED_FILE_NAME}"

    # Add /* eslint-disable */ to the top of the file
    if [[ $os == "linux" ]]; then
        sed -i '1s:^:/* eslint-disable */\n:' "${GENERATED_FILE_PATH}"
    elif [[ $os == "macos" ]]; then
        sed -i '' '1s:^:/* eslint-disable */\n:' "${GENERATED_FILE_PATH}"
    fi

    npx prettier --write "${GENERATED_FILE_PATH}"
}


for f in "$ROOT_DIR"/protos/*.proto; do
    process_file "$f"
done
