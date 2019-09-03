#!/usr/bin/env bash
set -eo pipefail

function main {
    if [ ! -d "/tmp/sourcemapper" ]; then
        git clone --depth 1 git@github.com:dhoko/sourcemapper.git "/tmp/sourcemapper";
    else
        echo "we have a cache"
    fi;

    rm -rf ./dist;
    npm run build;

    for file in $(find ./dist/ -type f -name "*.js.map");
    do
        echo "[Parsing] $file";
        /tmp/sourcemapper/bin/sourcemapper --input "$file" --output 'i18n-js' &
    done;

    wait;

    # ignore pmcrypto as it contains mailparser :/
    npx ttag extract $(find ./i18n-js -type f -name '*.js' -not -path "*/pmcrypto/*" -not -path "*/core-js/*") -o "$1";

    rm -rf "./i18n-js";
    ls -lh ./po
}

main "$1";
