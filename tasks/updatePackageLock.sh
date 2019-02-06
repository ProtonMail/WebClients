#!/usr/bin/env bash
set -eo pipefail

git update-index --no-assume-unchanged package-lock.json;

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD);
CHANGED=$(git diff-index --name-only HEAD);

# Prevent error if the file is not in the working tree
if [[ "$CHANGED" = *"package-lock.json"* ]]; then

    # Commit only on v3, we don't want it inside another branch -> prevent conflicts and V3 is the only source of truth
    if [[ "$CURRENT_BRANCH" = 'v3' ]]; then
        git add package-lock.json && git commit -m "Upgrade dependencies";
        git push origin v3;
    else
        git checkout package-lock.json
    fi;

fi;

git update-index --assume-unchanged package-lock.json;
