#!/usr/bin/env bash

set -eo pipefail

readonly TEST_FILES='test/input/js';

function main {

  local hasError=false;

  for file in "$TEST_FILES"/*; do

    echo "[~] validate ${file}";

    local expectedFile="$(sed 's/\.js$//; s/input/output/' <<< "$file")";
    local output="$(node scripts/linter.mjs "$file")";
    local expectedOutput="$(cat "$expectedFile")";

    if [ "$expectedOutput" != "$output" ]; then
      hasError=true;
      echo -e " 💥 \e[1m\e[31mError\e[39m\e[0m wrong output for ${file}"
      echo -e "\e[4m🤖 Output\e[0m:"
      echo "$(echo "$output")";
      echo
      echo -e "\e[4m🤖 Expected\e[0m:"
      echo "$expectedOutput";

      echo
      echo '-----------------[DIFF]-----------------------'
      echo
      diff -rupP <(echo "$output") <(echo "$expectedOutput")
      echo
      echo '-----------------[/DIFF]-----------------------'
      exit
    else
      echo -e "\e[32m ✔ lint translations for ${file}\e[0m";
    fi;

  done

  if "$hasError"; then
    return 1
  fi
}

main
