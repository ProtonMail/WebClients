#!/usr/bin/env bash
set -eo pipefail

##
# Extract all the files we need to parse to get the translations
#   - react-components
#   - proton-shared
#   - app sources
#
# We remove as much files a possible so it's faster
getFileList() {
  # Remove what we do not need to filter + it makes find more complex
  rm -rf node_modules | true
  rm -rf webpack:/*/webpack | true
  rm -rf webpack:/*/locales | true

  grep -Ril "from 'ttag'" .
}

getDistDirectory() {
  if [ -s "dist" ]; then
    echo "extract from dist bundle local"
    return 0
  fi

  # Cache for the CI so we're faster
  if [ -s 'webapp-bundle.tar.gz' ]; then
    echo "we extract the bundle"
    rm -rf dist || true
    mkdir dist
    tar xzf webapp-bundle.tar.gz -C dist
  else
    echo "bundle must be built first"
    exit 1
  fi
}

function main {
  ls -lSha
  pwd;

  appName="$(jq -r .name package.json)"

  if [ ! -d "/tmp/sourcemapper" ]; then
    echo "missing source mapper, run ./build.sh"
    exit 1
  fi;

  getDistDirectory

  # Extract all the code available inside the dist and only the one we built (post tree-shacking)
  for file in $(find ./dist/ -type f -name "*.js.map"); do
    echo "[Parsing] $file";
    if [[ "$OSTYPE" = "darwin"* ]]; then
      if [[ "$(uname -m)" == 'arm64'  ]]; then
        /tmp/sourcemapper/bin/isourcemapper-arm --input "$file" --output 'i18n-js' &> /dev/null &
      else
        /tmp/sourcemapper/bin/isourcemapper --input "$file" --output 'i18n-js' &> /dev/null &
      fi
    else
      /tmp/sourcemapper/bin/sourcemapper --input "$file" --output 'i18n-js' &> /dev/null &
    fi
  done;

  wait;

  # Extract on top of the extracted code from the bundle
  # Use direct relative path instead of npx or dlx since it doesn't resolve to the installed dependencies
  (
    cd i18n-js;
    echo "Running ttag extract"
    # Output from ttag extract is full of babel errors, silence it
    ../../../node_modules/.bin/ttag extract $(getFileList) -o "../${1}" 2>&1;
    echo "done"
  )

  # Remove useless path
  if [[ "$OSTYPE" = "darwin"* ]]; then
    sed -i '' 's|webpack:/||g;s| /src/app/| src/app/|g' "$1";
  else
    sed -i 's|webpack:/||g;s| /src/app/| src/app/|g' "$1";
  fi

  #rm -rf "./i18n-js";
}

main "$1";
