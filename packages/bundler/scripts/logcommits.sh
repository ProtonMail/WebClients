#!/usr/bin/env bash
set -eo pipefail

function logCommit {
    local branch=$(echo "$1" | awk -F "origin/" '{print $2}');
    local commit=$(git rev-parse "$1");
    printf '%-20s' "[$branch]";
    printf '%-20s' "$commit";
    echo
}

function extractDiffCommit {
    local issueURL="$2";
    local messageDeploy=$(git log --format=%b -n 1 "$(git rev-parse origin/deploy-$1)");
    local hash="$(echo $messageDeploy | awk -F 'commit' '{print $2}' | xargs | awk '{print $1}')";

    # We ignore commits from the CI
    for commit in $(git log "$hash"..HEAD --format=%H --invert-grep --grep="\[I18N@" --grep="Upgrade dependencies"); do
        local msg="$(git log "$commit" --format=%s -n 1)";
        local issueID="$(echo $msg | awk 'match($0, /#([0-9]{1,4})/, arr) {
            print arr[1];
        }')";
        if [ -n "$issueID" ]; then
            echo "- $msg ~ $issueURL$issueID";
        else
            echo "- $msg";
        fi;
    done;
}


if [ "$1" = 'changelog' ]; then
    BRANCH="";
    ISSUE_URL="";

    while [ ! $# -eq 0 ]; do
      case "$1" in
        --branch | -b) BRANCH="$2"; ;;
        --issue-url) ISSUE_URL="$2"; ;;
      esac
      shift
    done;

    extractDiffCommit $BRANCH $ISSUE_URL;
    exit;
fi;


if [[ "${1}" =~ (dev|beta|old|tor) ]]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy-$1 ]]; then
            logCommit "$branch";
        fi;
    done;
fi


if [ "$1" = 'prod' ]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy-prod ]]; then
            logCommit "$branch";
        fi;
    done;
fi

if [ -z "$1" ]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy(-prod-|-beta|-tor|-dev) ]]; then
            logCommit "$branch";
        fi;
    done;
fi
