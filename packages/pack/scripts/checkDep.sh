#!/usr/bin/env bash
set -eo pipefail

ERRORS=();

function log {
    if [[ "$1" = *"warn"* ]]; then
      echo
      echo -e "\e[00;35m--------- ⚠ WARNING ⚠ ---------\e[00m";
      echo -e "$2"
      echo
    fi
    if [[ "$1" = *"error"* ]]; then
      echo -e "\e[00;31m$2\e[00m";
    fi
    if [[ "$1" = *"success"* ]]; then
      echo -e "\e[00;32m[$2] ✔ $3\e[00m";
      echo
    fi
    if [[ "$1" = *"info"* ]] && $IS_VERBOSE; then
      echo "[$1] - $2";
    fi
}

function timestamp {
    date +%s;
}

function isRunnable {
    local tsnow="$(timestamp)";
    local cache="node_modules/.proton-back-checkDep";
    local latest="$(cat "$cache" 2>/dev/null || timestamp)";
    local delta="$((tsnow - latest))";

    if [[ "3600" -gt "$delta" ]] && [[ -e "$cache" ]]; then
        exit;
    fi;

    echo "$tsnow" > "$cache";
}

function getRemoteVersion {
    curl --silent "https://api.github.com/repos/ProtonMail/$1/tags" | grep 'name' | head -1 | xargs | sed 's/,//' | awk '{print $2}';
    # Slower
    # git ls-remote  --tags git@github.com:ProtonMail/proton-pack.git  | tail -2 | head -1 | awk '{print $2}' | awk -F '/' '{print $3}' | xargs;
}

function getVersion {
    local tag="$(cat "node_modules/$1/package.json" | grep \"version\": | awk -F : '{print $2}' | sed 's/"//g' | sed 's/,//' | xargs)";
    echo "v$tag";
}

function checkDep {
    local local="$(getVersion "$1")";
    local remote="$(getRemoteVersion "$1")";

    if [[ $local != $remote ]]; then
        ERRORS+=("$1 \n    [local]: $local\n    [latest]: $remote");
    fi;
}

# Run only the check every 1 hour to prevent limit rate API
isRunnable;

checkDep 'proton-pack';
checkDep 'proton-bundler';
checkDep 'proton-i18n';

if [ -n "$ERRORS" ]; then
    log "warn"  "Version mismatch";
    echo
    for ((i = 0; i < ${#ERRORS[@]}; i++))
    do
        log "error"  "➙ ${ERRORS[$i]}";
        echo
    done

    log "info" "Please upgrade your dependencies."
    log "info" "You can run npm update <dependency> or rm package-lock.json and node_modules".
fi;
