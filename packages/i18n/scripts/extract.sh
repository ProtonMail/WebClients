#!/usr/bin/env bash
set -eo pipefail

function main {
    if [ ! -d "/tmp/sourcemapper" ]; then
        git clone --depth 1 https://github.com/dhoko/sourcemapper.git "/tmp/sourcemapper";
    else
        echo "we have a cache"
    fi;

    if [ ! -d "src/i18n" ]; then
        mkdir 'src/i18n';
    fi;

    rm -rf ./dist;
    npm run build;

    for file in $(find ./dist/ -type f -name "*.js.map");
    do
        echo "[Parsing] $file";
        if [[ "$OSTYPE" = "darwin"* ]]; then
            /tmp/sourcemapper/bin/isourcemapper --input "$file" --output 'i18n-js' &
        else
            /tmp/sourcemapper/bin/sourcemapper --input "$file" --output 'i18n-js' &
        fi
    done;

    wait;

    # ignore pmcrypto as it contains mailparser :/
    npx ttag extract $(find ./i18n-js -type f -name '*.js' -not -path "*/pmcrypto/*" -not -path "*/core-js/*") -o "$1";

    # Remove useless path
    if [[ "$OSTYPE" = "darwin"* ]]; then
        sed -i '' 's|i18n-js/webpack:/||g;s| /src/app/| src/app/|g' "$1";
    else
        sed -i 's|i18n-js/webpack:/||g;s| /src/app/| src/app/|g' "$1";
    fi

    rm -rf "./i18n-js";
    ls -lh ./po
}

main "$1";
