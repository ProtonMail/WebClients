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

  # can't use the iregex flag,
  # it doesn't work on PopOS 20.04 (wtf) and on MacOS as the find utility
  # is too old. -> can't even run find --version
  find * \
    -type f \
    -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"
  # -not -path does not work
}

getDistDirectory() {
  # inside the CI we have the dist directory available
  if [ -n "$CI_COMMIT_REF_NAME" ] && [ -s dist ]; then
    return 0;
  fi

  # Cache for the CI so we're faster
  if [ -s 'webapp-bundle.tar.gz' ]; then
    echo "we extract the bundle"
    rm -rf dist || true
    mkdir dist
    tar xzf webapp-bundle.tar.gz -C dist
  else
    echo "we create the bundle"
    yarn run build
  fi
}

function main {
  ls -lSha
  pwd;

  appName="$(jq -r .name package.json)"

  # Custom flow for proton pass as we build many versions
  if [[ "$appName" == "proton-pass-extension" ]]; then
    versionRelease="$(jq -r .version manifest-chrome.json)"
    echo "rename proton pass extension $versionRelease as dist"
    cp -r "release/ProtonPass-chrome-${versionRelease}" dist
  fi;

  if [ ! -d "/tmp/sourcemapper" ]; then
    git clone \
      --quiet \
      --single-branch \
      --depth 1 \
      https://github.com/dhoko/sourcemapper.git "/tmp/sourcemapper";
  else
    echo "we have a cache for the sourcemapper"
  fi;

  getDistDirectory

  # Extract all the code available inside the dist and only the one we built (post tree-shacking)
  for file in $(find ./dist/ -type f -name "*.js.map"); do
    echo "[Parsing] $file";
    if [[ "$OSTYPE" = "darwin"* ]]; then
      /tmp/sourcemapper/bin/isourcemapper --input "$file" --output 'i18n-js' &
    else
      /tmp/sourcemapper/bin/sourcemapper --input "$file" --output 'i18n-js' &
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

  rm -rf "./i18n-js";
}

main "$1";
