#!/usr/bin/env sh
set -euo

if [ "${QA_BUILD:-true}" = "false" ]; then
  tauri build -v --no-bundle
else
  tauri build -v --no-bundle --features devtools
fi
