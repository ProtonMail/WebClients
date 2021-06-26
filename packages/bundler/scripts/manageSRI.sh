#!/usr/bin/env bash
set -eo pipefail

# Based on https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity#Tools_for_generating_SRI_hashes
function sriGenerator {
    echo $(cat "$1" | openssl dgst -sha384 -binary | openssl base64 -A)
}

# Update the index.js hash inside the index.html
function bindHTMLSRI {
    local HTML="$(cat dist/index.html)";

    local oldIndexJS="$(find distProd -maxdepth 1 -type f -name 'index.*.js')";
    local newIndexJS="$(find dist -maxdepth 1 -type f -name 'index.*.js')";
    local oldHashJS="$(sriGenerator "$oldIndexJS")";
    local newHashJS="$(sriGenerator "$newIndexJS")";

    echo "[oldIndexJS]: $oldIndexJS"
    echo "[newIndexJS]: $newIndexJS"
    echo "[oldHashJS]: $oldHashJS"
    echo "[newHashJS]: $newHashJS"

    echo $HTML | sed "s|sha384-$oldHashJS|sha384-$newHashJS|g;" > 'dist/index.html';
}

# Update hashes for ref files inside the index.js
# @param {String} Sed config replace
function bindIndexSRI {
    local index="$(find distCurrent -maxdepth 1 -type f -name 'index.*.js')";
    local newIndex="$(find dist -maxdepth 1 -type f -name 'index.*.js')";
    cat "$index" | sed "$1" > "$newIndex";
}

# List files where we have the config
# @param {String} type of files (distProd for prod files, '' for new files)
function listFiles {
    if [[ "$1" = "distProd" ]]; then
        find distProd -maxdepth 1 -type f -name '*.chunk.js' ! -name 'vendor*' ! -name 'app*'
    else
        find dist -maxdepth 1 -type f -name '*.chunk.js' ! -name 'vendor*' ! -name 'app*'
    fi
}

# Generate SRI config for a type of files (prod or new one)
function getSRIFiles {
    for file in $(listFiles "$1"); do
        echo "$file: $(sriGenerator "$file")";
    done;
}

function getSentryConfig {
    if [ -s 'appConfig.json' ]; then
        jq ".$env.sentry" appConfig.json;
        return 0;
    fi;

    jq ".$env.sentry" env/env.json
}

VALIDATE_ERRORS=();

# Validate the config for a build
#   - Check A/B testing config for prod-b
#   - Check sentry for everyone
# @param {String} env to validate (dev, prod-b etc.)
# @param {String} filePath to validate
function validateConfigFile {
    local envRaw=$(echo "$1" | awk -F "-" '{print $1}');
    local env=$([ "$envRaw" == 'tor' ] && echo "prod" || echo "$envRaw");
    local sentryConfig="$(getSentryConfig)";

    # Only one with specific A/B config -- obsolete
    if [[ "$1" = "prod-b" ]]; then
        local ab=$(node -e "let b=require('./env/config.constants').STATS_ID.b;console.log('siteId:'+b.siteId,'###','abSiteId:'+b.abSiteId);");
        local siteId=$(echo "$ab" | awk -F "###" '{print $1}' | xargs);
        local abSiteId=$(echo "$ab" | awk -F "###" '{print $2}' | xargs);

        if grep -q "siteId:" "$2" &&  ! grep -q "$siteId" "$2"; then
            VALIDATE_ERRORS+=("[$1] Wrong siteId inside $2");
        fi;

        if grep -q "abSiteId:" "$2" &&  ! grep -q "$abSiteId" "$2"; then
            VALIDATE_ERRORS+=("[$1] Wrong abSiteId inside $2");
        fi;
    fi;

    if grep -q "sentry:{" "$2" && ! grep -q "$sentryConfig" "$2"; then
        VALIDATE_ERRORS+=("[$1] Wrong sentryConfig inside $2");
    fi;
}

# Validate SRI and the config
#   - Check if SRI of new files are inside index.js
#   - Check if the config is valid
#   - Check if index.html contains the right SRI for index.js
function validate {
    local files=$(find dist -maxdepth 1 -type f -name '*.chunk.js' ! -name 'vendor*' ! -name 'app*');
    local newIndex="$(find dist -maxdepth 1 -type f -name 'index.*.js')";

    for file in $files; do
        local hash="$(sriGenerator "$file")";
        if ! grep -q "$hash" "$newIndex"; then
            VALIDATE_ERRORS+=("[$1] Wrong SRI inside $newIndex for $file");
            validateConfigFile "$1" "$file";
        fi;
        validateConfigFile "$1" "$file";
    done;

    local hashIndex="$(sriGenerator "$newIndex")";
    if ! grep -q "$hashIndex" "dist/index.html"; then
        VALIDATE_ERRORS+=("[$1] Wrong SRI inside index.html for $newIndex");
    fi;

    # Log errors and break
    if [ -n "$VALIDATE_ERRORS" ]; then
        for item in "${VALIDATE_ERRORS[@]}"; do
            echo  "    ➙ $item"
        done
        exit 1;
    fi;
}

function writeEnv {

    local newVersion='';
    local newEnv="$(grep -vE 'APP_ENV' dist/.env)";
    local newAppEnv="APP_ENV=${1/+proxy}";

    if [ "$1" = 'prod' ]; then
        newEnv="$(grep -vE 'APP_CURRENT_VERSION|APP_ENV' dist/.env)";
        local newVersion="$(awk -F '~' '{$NF=""; print $0}' dist/.env | xargs)";
        echo "$newEnv" > dist/.env
        echo "$newAppEnv" >> dist/.env
        echo "$newVersion" >> dist/.env
        return 0;
    fi;

    echo "$newEnv" > dist/.env
    echo "$newAppEnv" >> dist/.env
}

if [[ "$1" == "get-prod" ]]; then
    getSRIFiles 'distProd' | awk -F ': ' '
      BEGIN { ORS = ""; print " { "}
      /Filesystem/ {next}
      { printf "%s\"%s\": \"%s\"",
            separator, $1, $2
        separator = ", "
      }
      END { print " } " }
  ';
fi;

if [[ "$1" == "get-new" ]]; then
    getSRIFiles 'dist' | awk -F ': ' '
      BEGIN { ORS = ""; print " { "}
      /Filesystem/ {next}
      { printf "%s\"%s\": \"%s\"",
            separator, $1, $2
        separator = ", "
      }
      END { print " } " }
  ';
fi;

if [[ "$1" == "write-html" ]]; then
    bindHTMLSRI
fi;

if [[ "$1" == "write-index" ]]; then
    bindIndexSRI "$2"
fi;

if [[ "$1" == "write-env" ]]; then
    writeEnv "$2"
fi;

if [[ "$1" == "validate" ]]; then
    validate "$2"
fi;
