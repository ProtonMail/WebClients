#!/usr/bin/env bash
set -eo pipefail

git fetch origin main:main
git checkout main

# PARENT_DIR relative to location of script of file system
PARENT_DIR="$(dirname "${BASH_SOURCE[0]}")"

cd "$PARENT_DIR"/..

# Notice the "." at the end
# We're taking the latest merge commit that affected the current directory
# We're skipping one of the merge commits since this script is intended to
# trigger on a merge into the main branch and we don't want to compare with
# the commit that triggered the script to run in the first place.
LATEST_MERGE_COMMIT="$(git log --full-history --skip 1 --merges -n 1 --pretty=format:%H .)"

echo "SHA of latest merge commit: $LATEST_MERGE_COMMIT"

DIFF="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md || true)"

if ! [[  "$DIFF" =~ ^diff ]]; then
    echo "No new changelog diffs between latest merge commit and now"
    exit 0
fi

TEXT="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md | grep -E "^\+" | sed -e 's/^\+//' | tail -n +2 | node scripts/format)"

echo "Changelog contains new entries \n\n$TEXT"

curl -X POST -H 'Content-type: application/json' --data "{ \"text\": $TEXT }" "${SLACK_WEBHOOK_URL}"
