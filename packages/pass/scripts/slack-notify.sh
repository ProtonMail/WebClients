#!/usr/bin/env bash
# Usage: ./slack-notify.sh {title} ({description}:{job_id})...

# Determine the current state based on whether we are triggered
# from a tag, commit, or manually for testing purposes. If there
# is no CI_COMMIT_TAG, then use the latest commit in the pipeline.
CURRENT_STATE=${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}}

# Notification header
BLOCKS="[
    {
        \"type\": \"header\",
        \"text\": {
            \"type\": \"plain_text\",
            \"emoji\": true,
            \"text\": \":protonpass: $1 [$CURRENT_STATE]\"
        }
    }"

# Notification body
for arg in "${@:2}"; do # Skip first {title} argument
    IFS=':' read -r description jobid <<<"$arg"

    # Add a section block for each job
    BLOCKS="$BLOCKS,
    {
        \"type\": \"section\",
        \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"*${description}*: <${CI_PROJECT_URL}/-/jobs/${jobid}/artifacts/download|Download> (expires in 1 week)\"
        }
    }"
done

BLOCKS="$BLOCKS]"

SLACK_POST_BODY=$(echo "{
    \"channel\": \"$PASS_EXTENSION_BUILD_SLACK_CHANNEL_ID\",
    \"blocks\": $BLOCKS
}" | jq -r '.')

curl \
    -X POST https://slack.com/api/chat.postMessage \
    -H "Content-type: application/json; charset=utf-8" \
    -H "Authorization: Bearer ${SIMPLE_LOGIN_SLACK_BOT_TOKEN}" \
    --data-raw "$SLACK_POST_BODY"
