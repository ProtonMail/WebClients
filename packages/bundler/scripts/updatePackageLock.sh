#!/usr/bin/env bash
set -eo pipefail

DEFAULT_BRANCH="${1:-master}";

git update-index --no-assume-unchanged package-lock.json;

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD);
CHANGED=$(git diff-index --name-only HEAD);

# Prevent error if the file is not in the working tree
if [[ "$CHANGED" = *"package-lock.json"* ]]; then

    # Commit only on default branch, we don't want it inside another branch -> prevent conflicts and default branch is the only source of truth
    if [[ "$CURRENT_BRANCH" = "$DEFAULT_BRANCH" ]]; then
        git add package-lock.json && git commit -m "Upgrade dependencies" || echo "Nope";
        git push origin "$DEFAULT_BRANCH" || echo "Nope";
    else
        git checkout package-lock.json
    fi;

fi;

git update-index --assume-unchanged package-lock.json;
