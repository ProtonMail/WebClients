#!/usr/bin/env bash
set -eo pipefail

function getVersion {
    local version=$(node -e "console.log(require('./package.json').version)");
    [ "$1" ] && echo "$1" || echo "$version";
}

function getCommit {
    [ "$1" ] && echo "$1" || git rev-parse HEAD;
}

function toJSON {
    local tpl='{ "version": "#version", "commit": "#commit" }';
    local commit=$(getCommit "$1");
    local version=$(getVersion "$2");
    echo "$tpl" | sed "s/#commit/$commit/; s/#version/$version/;"
}

if [ -z "$3" ]; then
    mkdir -p build/assets;
fi;

##
#  Write JSON version inside assets
#  -1: commit hash
#  -2: version tag
#  -3: path
#
toJSON "$1" "$2" > "${3-build/assets/version.json}";
