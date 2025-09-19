#!/usr/bin/env bash
# Usage: ./slack-notify.sh

# Determine the current state based on whether we are triggered
# from a tag, commit, or manually for testing purposes. If there
# is no CI_COMMIT_TAG, then use the latest commit in the pipeline.
CURRENT_STATE=${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}}

if [[ -z "$WINDOWS_JOB_ID" || -z "$LINUX_JOB_ID" || -z "$PASS_EXTENSION_BUILD_SLACK_CHANNEL_ID" || -z "$SIMPLE_LOGIN_SLACK_BOT_TOKEN" ]]; then
    exit 1
fi

BLOCKS="[
    {
        \"type\": \"header\",
        \"text\": {
            \"type\": \"plain_text\",
            \"emoji\": true,
            \"text\": \":authenticator: Proton Authenticator [$CURRENT_STATE]\"
        }
    },
    {
        \"type\": \"section\",
        \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"*Windows*: <${CI_PROJECT_URL}/-/jobs/${WINDOWS_JOB_ID}/artifacts/download|Download> (expires in 1 week)\"
        }
    },
    {
        \"type\": \"section\",
        \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"*Linux*: <${CI_PROJECT_URL}/-/jobs/${LINUX_JOB_ID}/artifacts/download|Download> (expires in 1 week)\"
        }
    }
]"

SLACK_POST_BODY=$(echo "{
    \"channel\": \"$PASS_EXTENSION_BUILD_SLACK_CHANNEL_ID\",
    \"blocks\": $BLOCKS
}" | jq -r '.')

curl \
    -X POST https://slack.com/api/chat.postMessage \
    -H "Content-type: application/json; charset=utf-8" \
    -H "Authorization: Bearer ${SIMPLE_LOGIN_SLACK_BOT_TOKEN}" \
    --data-raw "$SLACK_POST_BODY"
