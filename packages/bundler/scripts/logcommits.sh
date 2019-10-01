#!/usr/bin/env bash
set -eo pipefail

function logCommit {
    local branch=$(echo "$1" | awk -F "origin/" '{print $2}');
    local commit=$(git rev-parse "$1");
    printf '%-20s' "[$branch]";
    printf '%-20s' "$commit";
    echo
}

function printLine {
    local issueURL="$2";

    local msg="$(git log "$1" --format=%s -n 1)";
    local body="$(git log "$1" --format=%b -n 1 | xargs)";
    local issueID="$(echo $msg | awk 'match($0, /#([0-9]{1,4})/, arr) {
        print arr[1];
    }')";

    # Fix issue from another repository
    if [[ "$body" =~ https:\/\/github\.com\/ProtonMail ]]; then
        echo "- $msg ~ $body";
        return 0;
    fi;

    # Fix issue from the current repository
    if [ -n "$issueID" ]; then
        echo "- $msg ~ $issueURL/$issueID";
        return 0;
    fi;

    # Log message
    echo "- $msg";
}

##
# Log commits for the changelog.
# From the lastest build to the current one, what did we change ?
# Arg 1 <String> hash of the commit to strart the revision
# Arg 2 <String> URL of the repository to bind the issue URL with number
function logCommits {
    # We ignore commits from the CI
    for commit in $(git log "$1"..HEAD --format=%H --invert-grep --grep="\[I18N@" --grep="Upgrade dependencies" --grep="Merge branch"); do
        printLine "$commit" "$2";
    done;
}

function getChangelogRepo {
    # Body from message deploy contains the hash of the original commit
    local messageDeploy=$(git log --format=%b -n 1 "$(git rev-parse origin/deploy-$1)");
    local hash="$(echo $messageDeploy | awk -F 'commit' '{print $2}' | xargs | awk '{print $1}')";
    logCommits "$hash" "$2";
}

function getChangelogReactComponents {
    if [ -f 'package-lock.json' ]; then

        # Ex: WebClient does need it yet
        if ! grep -q 'react-components' package-lock.json; then
            return 0;
        fi

        # Create a copy with latest revision pre-deploy of the lockfile (contains the hash of dependencies)
        git show HEAD~1:package-lock.json > /tmp/oldLock.json;

        # Extract hash of the previous react-components version we used to have inside the app
        local hash=$(node -e "console.log(require('/tmp/oldLock.json').dependencies['react-components'].version)" | awk -F '#' '{print $2}');

        rm -rf /tmp/react-components || echo 'nope';

        # Faster to clone
        git clone "git@github.com:ProtonMail/react-components.git" --depth 30 --branch master /tmp/react-components;
        cd /tmp/react-components;

        # Get the issue URL inside the package.
        local url=$(node -e "console.log(require('./package.json').bugs.url)");

        logCommits "$hash" "$url";
    fi;
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

    if [ -z "$BRANCH" ] || [ -z "$ISSUE_URL" ]; then
        echo "You must set a branch or an issue URL";
        echo "Flags:"
        printf '%-20s' "    --branch" "Name of the branch to use to create a diff changelog";
        echo ""
        printf '%-20s' "    --issue-url" "Repository issue URL";
        echo ""
        exit 1;
    fi;

    getChangelogRepo $BRANCH $ISSUE_URL;
    getChangelogReactComponents
    exit;
fi;

if [[ "${1}" =~ (dev|beta|old|tor) ]]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy-$1 ]]; then
            logCommit "$branch";
        fi;
    done;
    exit;
fi


if [ "$1" = 'prod' ]; then

    IS_WEBSITE=false;

    while [ ! $# -eq 0 ]; do
      case "$1" in
        --website) IS_WEBSITE=true; ;;
      esac
      shift
    done;

    for branch in $(git branch -a);
    do
        if [ $IS_WEBSITE = false ] && [[ ${branch} =~ origin/deploy-prod ]]; then
            logCommit "$branch";
        fi;

        # ¯\_(ツ)_/¯ https://www.youtube.com/watch?v=d7RWIcOcHgg
        if [ $IS_WEBSITE = true ] && [[ ${branch} =~ origin/deploy-(a|b|prod) ]]; then
            logCommit "$branch";
        fi;
    done;
    exit;
fi

if [ -z "$1" ]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy(-prod-|-beta|-tor|-dev) ]]; then
            logCommit "$branch";
        fi;
    done;
fi
