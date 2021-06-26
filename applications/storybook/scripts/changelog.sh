#!/usr/bin/env bash
set -eo pipefail

git checkout develop

LATEST_MERGE_COMMIT="$(git log --skip 1 --merges -n 1 --pretty=format:%H)"

echo "SHA of latest merge commit: $LATEST_MERGE_COMMIT"

DIFF="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md || true)"

if ! [[  "$DIFF" =~ ^diff ]]; then
    echo "No new changelog diffs between latest merge commit and now"
    exit 0
fi

TEXT="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md | grep -E "^\+" | sed -e 's/^\+//' | tail -n +2 | node scripts/format)"

echo "Changelog contains new entries \n\n$TEXT"

curl -X POST -H 'Content-type: application/json' --data "{ \"text\": $TEXT }" "${SLACK_WEBHOOK_URL}"
