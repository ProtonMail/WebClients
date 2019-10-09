#!/bin/bash
set -eo pipefail


FILE=CHANGELOG.md

echo "Extracting release notes... $1"
output=`npx releaser \
    --config releaser.config.js \
    --token $(cat env/.env | grep RELEASER_GH_TOKEN | awk -F '=' '{print $2}') \
    --type "${1:-patch}"`


echo "Done!"
echo "Unshifting to $FILE"

content="$(echo -e "$output\n" | cat - "$FILE")";
echo "$content" > "$FILE";

echo "Done!"
