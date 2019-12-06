#!/usr/bin/env bash

set -eo pipefail

EXPECTATION_BROKEN='test/files/broken-expectation'
EXPECTATION_VALID='test/files/valid-expectation';


# Generate new output for tests
if [ "$1" = 'update' ]; then
  scripts/lint.sh test/js/broken %2> "$EXPECTATION_BROKEN" || true
  scripts/lint.sh test/js/valid %2> "$EXPECTATION_VALID" || true
  echo "✔ New output for tests available";
fi;

# Run tests
if [ "$1" = 'test' ]; then

  scripts/lint.sh test/js/broken %2> "test/output-broken.log" || true
  scripts/lint.sh test/js/valid %2> "test/output-valid.log" || true

  hasError=false;
  expectedValid="$(cat "$EXPECTATION_VALID")";
  expectedBroken="$(cat "$EXPECTATION_BROKEN")";

  if [ "$(cat test/output-valid.log)" != "$expectedValid" ]; then
    hasError=true;
    echo -e " 💥 \e[1m\e[31mwrong output for VALID\e[39m\e[0m"
    echo -e "\e[4m📢 Value (output from config)\e[0m:"
    echo "$(cat test/output-valid.log)";
    echo
    echo -e "\e[4m🤖 Expected\e[0m:"
    echo "$expectedValid";

    echo
    echo '-----------------[DIFF]-----------------------'
    echo
    diff -rupP "$EXPECTATION_VALID" test/output-valid.log
  else
    echo -e "\e[32m ✔ lint translations for valid\e[0m";
  fi;

  cmp  $EXPECTATION_BROKEN test/output-broken.log

  if [ "$(cat test/output-broken.log)" != "$expectedBroken" ]; then
    hasError=true;
    echo -e " 💥 \e[1m\e[31mwrong output for BROKEN\e[39m\e[0m"
    echo -e "\e[4m📢 Value (output from config)\e[0m:"
    echo "$(cat test/output-broken.log)";
    echo
    echo -e "\e[4m🤖 Expected\e[0m:"
    echo "$expectedBroken";

    echo
    echo '-----------------[DIFF]-----------------------'
    echo
    diff -rupP "$EXPECTATION_BROKEN" test/output-broken.log
  else
    echo -e "\e[32m ✔ lint translations for broken\e[0m";
  fi;

  if $hasError; then
      exit 1;
  fi;
fi;
