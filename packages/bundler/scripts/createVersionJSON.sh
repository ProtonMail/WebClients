#!/usr/bin/env bash
set -eo pipefail

function getVersion {

    if [ -n "$1" ]; then
        echo "$1";
        return 0;
    fi;

    # Sadly MacOS doesn't have gawk but awk, which doesn't support this match :/
    # awk 'match($0, /"version": "([0-9]+\.[0-9]+\.[0-9]+)"/, arr) { print arr[1]; }'
    local version=$(cat package.json | awk '/"version": "(.+)"/{print $2}' | sed 's/"//g;s/,//g');
    echo "$version";
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

printf '%-20s' "[commit]";
printf '%-20s' "$1";
echo
printf '%-20s' "[tag]";
printf '%-20s' "$2";
echo
printf '%-20s' "[output]";
printf '%-20s' "${3-build/assets/version.json}";
echo

##
#  Write JSON version inside assets
#  -1: commit hash
#  -2: version tag
#  -3: path
#
toJSON "$1" "$2" > "${3-build/assets/version.json}";
