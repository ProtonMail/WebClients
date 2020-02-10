#!/usr/bin/env bash
set -eo pipefail

##
# This script should be useless but we found an issue with webpack. It was able to build everything
# and gives you an exit code 0 even if there were 2 errors inside the process and it the dist dir
# was empty...
#
# Ex:
# ERROR in ./node_modules/react-components/hooks/useGetAddressKeys.ts
# 433 Module build failed (from ./node_modules/babel-loader/lib/index.js):
# 434 Error: /builds/web/mail/proton-mail/node_modules/react-components/hooks/useGetAddressKeys.ts: # Expected type "Expression" with option {}, but instead got "SpreadElement".
#
# Awesome isn't it ?
# So this is why there is a script, to ensure even if webpack tells us "OK" it's really ok.
# https://www.youtube.com/watch?v=t3otBjVZzT0&feature=youtu.be


OUTPUT_DIR='dist';
OUTPUT_FILES="$(find "${OUTPUT_DIR}" -type f)";

function detect {
  echo "$OUTPUT_FILES" | grep -Ec "\.$1$";
}

function detectEmpty {
  local total=0;

  for file in $(echo "$OUTPUT_FILES" | grep -E "\.$1$"); do
    if [ ! -s "$file" ]; then
      ((total++))
      echo "[error] empty file: $file"  >&2;
    fi;
  done;

  echo "$total";
}

function main {
  local hasJS="$(detect 'js')";
  local hasCSS="$(detect 'css')";
  local hasHTML="$(detect 'html')";
  local hasSourceMap="$(detect 'map')";

  if [ "$hasJS" -eq 0 ]; then
    hasError=true;
    echo "[error] no JS found inside the directory: $OUTPUT_DIR";
  fi;

  if [ "$hasCSS" -eq 0 ]; then
    hasError=true;
    echo "[error] no CSS found inside the directory: $OUTPUT_DIR";
  fi;

  if [ "$hasHTML" -eq 0 ]; then
    hasError=true;
    echo "[error] no HTML found inside the directory: $OUTPUT_DIR";
  fi;

  if [ "$hasSourceMap" -eq 0 ]; then
    hasError=true;
    echo "[error] no SourceMaps found inside the directory: $OUTPUT_DIR";
  fi;


  local emptyJS="$(detectEmpty 'js')";
  local emptyCSS="$(detectEmpty 'css')";
  local emptyHTML="$(detectEmpty 'html')";
  local emptySourceMap="$(detectEmpty 'map')";

  if [ "$hasError" = true ] || [ "$emptyJS" -gt 0 ] || [ "$emptyCSS" -gt 0 ] || [ "$emptyHTML" -gt 0 ] || [ "$emptySourceMap" -gt 0 ]; then
    exit 1;
  fi
}

main
