# Warn that the script requires being merged into the main branch
# to work effectively since tags may become invalid if we keep
# rebasing on `main`
echo "This script may not work effectively until we are merged on the main branch."
echo "If we keep on rebasing on the main branch, our tags become invalid when trying to compute commit diffs."

# Determine the current state based on whether we are triggered
# from a tag, commit, or manually for testing purposes. If there
# is no CI_COMMIT_TAG, then use the latest commit in the pipeline.
CURRENT_STATE=${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}}
echo "[before] $CI_COMMIT_BEFORE_SHA"

# Determine the previous state based on whether the current state
# matches the latest merge commit or a commit tag in the current pipeline.
# If no commit tag is found, then we are dealing with a push commit,
# so select the `before` commit as the previous state.
if [[ ! -z "$CI_COMMIT_BEFORE_SHA" && "$CI_COMMIT_BEFORE_SHA" != "0000000000000000000000000000000000000000" ]]; then
    PREVIOUS_STATE=$CI_COMMIT_BEFORE_SHA
    echo "[previous commit] $PREVIOUS_STATE"
elif [[ ! -z "$CI_COMMIT_TAG" ]]; then
    PREVIOUS_STATE=$(git tag -l "proton-pass-extension@*" --sort=-committerdate | sed -n '2p')
    echo "[previous tag] $PREVIOUS_STATE"
else
    PREVIOUS_STATE=$CURRENT_STATE
    echo "[current commit] $PREVIOUS_STATE"
fi

# Display the states for which we will compute the diff
echo "Resolving diff from :"
echo "[ start ] $PREVIOUS_STATE"
echo "    |     ..."
echo "    ˅"
echo "[  end  ] $CURRENT_STATE"

# Compute the JIRA ticket IDs from the commit log between the
# current and previous states. Include the previous commit only
# if it matches the current commit.
if [[ "$PREVIOUS_STATE" && "$CURRENT_STATE" ]]; then
    JIRA_TICKET_IDS=$(git log $PREVIOUS_STATE^..$CURRENT_STATE | grep -o "IDTEAM-[0-9]*")
else
    JIRA_TICKET_IDS=$(git log $PREVIOUS_STATE..$CURRENT_STATE | grep -o "IDTEAM-[0-9]*")
fi

# Create a Slack message body containing JIRA ticket links
# for each unique ticket ID in the commit log
JIRA_KEYS=()
JIRA_SECTION=""

for ticket in $JIRA_TICKET_IDS; do
    link="https://jira.protontech.ch/browse/$ticket"
    key_exists=0
    for key in "${JIRA_KEYS[@]}"; do
        if [[ $key == $ticket ]]; then
            key_exists=1
            break
        fi
    done
    if [[ $key_exists -eq 0 ]]; then
        JIRA_KEYS+=($ticket)
        JIRA_SECTION+=", {
            \"type\": \"section\",
            \"text\": {
                \"type\": \"mrkdwn\",
                \"text\": \":jira: $ticket <$link|[link]>\"
            }
        }"
    fi
done

SLACK_POST_BODY=$(echo "{
        \"channel\": \"$PASS_EXTENSION_BUILD_SLACK_CHANNEL_ID\",
        \"blocks\": [
            {
                \"type\": \"header\",
                \"text\": {
                \"type\": \"plain_text\",
                \"emoji\": true,
                \"text\": \":protonpass: build $CURRENT_STATE\"
                }
            },
            {
                \"type\": \"section\",
                \"text\": {
                \"type\":\"mrkdwn\",
                \"text\":\"Download the *_unpacked extension_* <https://gitlab.protontech.ch/web/clients/-/jobs/$CI_JOB_ID/artifacts/download|here> (expires in 1 week)\"
                }
            }
            $JIRA_SECTION
        ]
    }" | jq -r '.')

curl \
    -X POST https://slack.com/api/chat.postMessage \
    -H "Content-type: application/json; charset=utf-8" \
    -H "Authorization: Bearer ${SIMPLE_LOGIN_SLACK_BOT_TOKEN}" \
    --data-raw "$SLACK_POST_BODY"
