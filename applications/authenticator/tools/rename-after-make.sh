#!/usr/bin/env bash
set -euo

echoerr() { echo "$@" 1>&2; }

SCRIPT_ROOT=$(dirname "$(realpath "$0")")
APP_ROOT=$(dirname "${SCRIPT_ROOT}")
BUILD_DIR="${APP_ROOT}/src-tauri/target/release/bundle"

for f in "${BUILD_DIR}"/**/*\ *; do
  mv "${f}" "${f// /}"
done
