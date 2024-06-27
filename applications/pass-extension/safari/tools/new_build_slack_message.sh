#!/bin/bash

set -eu

if [ $# -ne 1 ]; then
    echo "Usage: $0 build_name"
    exit 1
fi

build_name="$1"

token="$SLACK_TOKEN"
if [ -z "$token" ]; then
    echo "Missing SLACK_TOKEN environment variable"
    exit 1
fi

if [[ -n "${BRANCH_OR_TAG:-}" && -n "${CI_JOB_TOKEN:-}" ]]; then
    repo_url="https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.protontech.ch/web/clients.git"
    branch_name="$BRANCH_OR_TAG"
    commit_hash=$(git ls-remote $repo_url $BRANCH_OR_TAG | awk '{print $1}')
else
    branch_name=$(git rev-parse --abbrev-ref HEAD)
    commit_hash=$(git rev-parse HEAD)
fi

# Get author info
if [[ -n "${GITLAB_USER_NAME:-}" && -n "${GITLAB_USER_LOGIN:-}" ]]; then
    author="🤖 *$GITLAB_USER_NAME* (@$GITLAB_USER_LOGIN)"
else
    user_name=$(git config user.name)
    user_email=$(git config user.email)
    author="*$user_name* ($user_email)"
fi

# Just a simple JSON string
# See more here: https://app.slack.com/block-kit-builder/
message='{
  "channel": "#pass-web-releases",
  "blocks": [
    {
        "type": "header",
        "text": {
         "type": "plain_text",
            "text": "'"${build_name}"'"
        }
    },
    {
	    "type": "context",
		"elements": [
			{
				"type": "mrkdwn",
				"text": "'"${author}"'"
			}
		]
	},
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": ">`'"${branch_name}"'` ('"${commit_hash}"')"
        }
    }
  ]
}'

curl -H "Content-type: application/json; charset=utf-8" --data "${message}" -H "Authorization: Bearer ${token}" -X POST "https://slack.com/api/chat.postMessage"