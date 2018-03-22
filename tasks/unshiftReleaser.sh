#!/bin/bash
set -eo pipefail


FILE=CHANGELOG.md

echo "Extracting release notes..."
output=`npm run releaser:extract -s -- --verbosity 0`
echo "Done!"

echo "Unshifting to $FILE"
echo "$output

$(cat $FILE)" > $FILE
echo "Done!"
