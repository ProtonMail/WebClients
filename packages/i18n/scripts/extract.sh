#!/usr/bin/env bash
set -eo pipefail

function main {

    ##
    # Extract all the files we need to parse to get the translations
    #   - react-components
    #   - proton-shared
    #   - app sources
    #
    # We remove as much files a possible so it's faster
    getFileList() {
         # can't use the iregex flag, it doesn't work on PopOS 20.04 (wtf) and on MacOS as the find utility is too old. -> can't even run find --version
        find ./i18n-js \
            -type f \
            -o -name "*.js" \
            -o -name "*.ts" \
            -o -name "*.jsx" \
            -o -name "*.tsx" \
            -not -path "*/pmcrypto/*" \
            -not -path "*/core-js/*" \
            -not -path "*/dist/openpgp.*" | grep -E '(webpack:\/src|react-components|proton-shared)'
    }


    if [ ! -d "/tmp/sourcemapper" ]; then
        git clone --depth 1 https://github.com/dhoko/sourcemapper.git "/tmp/sourcemapper";
    else
        echo "we have a cache"
    fi;

    # Cache for the CI so we're faster
    if [ -s 'webapp-bundle.tar.gz' ]; then
        echo "we extract the bundle"
        rm -rf dist || true
        mkdir dist
        tar xzf webapp-bundle.tar.gz -C dist;
    else
        echo "we create the bundle"
        rm -rf ./dist;
        npm run build;
    fi

    for file in $(find ./dist/ -type f -name "*.js.map"); do
        echo "[Parsing] $file";
        if [[ "$OSTYPE" = "darwin"* ]]; then
            /tmp/sourcemapper/bin/isourcemapper --input "$file" --output 'i18n-js' &
        else
            /tmp/sourcemapper/bin/sourcemapper --input "$file" --output 'i18n-js' &
        fi
    done;

    wait;
    npx ttag extract $(getFileList) -o "$1";

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
