#!/usr/bin/env bash
set -eo pipefail

git checkout develop

LATEST_MERGE_COMMIT="$(git log --skip 1 --merges -n 1 --pretty=format:%H)"
echo "$LATEST_MERGE_COMMIT"

DIFF="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md || true)"

if ! [[  "$DIFF" =~ ^diff ]]; then
    echo "No new CHANGELOG diffs"
    exit 0
fi

TEXT="$(git diff "$LATEST_MERGE_COMMIT" HEAD CHANGELOG.md | grep -E "^\+" | sed -e 's/^\+//' | tail -n +2 | node scripts/format)"
echo "$TEXT"

curl -X POST -H 'Content-type: application/json' --data "{ \"text\": $TEXT }" "${SLACK_WEBHOOK_URL}"
