#!/usr/bin/env bash
set -eo pipefail

npm i svgo;

for file in $(find . -type f -name "*.svg" -not -path "./node_modules/*"); do
	echo "[LINT]: $file";
	npx svgo "$file" -q 2>&1 -o /dev/null;
done;
