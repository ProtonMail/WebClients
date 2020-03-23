#!/usr/bin/env bash
set -eo pipefail

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
    local i=0;
    # We ignore commits from the CI
    for commit in $(git log "$1"..HEAD --format=%H --invert-grep --grep="\[I18N@" --grep="Upgrade dependencies" --grep="Merge branch" --grep="Add change log for" --grep="Fix lint" --grep="[CI]"); do
        printLine "$commit" "$2";
        ((i+=1))

        # Limit to 25 to prevent too many commits
        if [ "$i" -eq 25 ]; then
            break;
        fi;
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
        git clone --quiet "git@github.com:ProtonMail/react-components.git" --depth 30 --branch master /tmp/react-components;
        cd /tmp/react-components;

        # Get the issue URL inside the package.
        local url=$(node -e "console.log(require('./package.json').bugs.url)");

        logCommits "$hash" "$url";
    fi;
}

function generateV4Logs {
    local i=0;
    local commits=$(git log --since="$1" --format=%H --invert-grep --grep="\[I18N@" --grep="Upgrade dependencies" --grep="Merge branch" --grep="Add change log for" --grep="Fix lint" --grep="[CI]");

    if [ -z "$commits" ]; then
        return 0;
    fi;

    local url=$(node -e "console.log(require('./package.json').bugs.url)" | sed 's/WebClient/Angular/i');
    local appName="$(cat package.json | grep '"name"' | awk '{print $2}' | sed 's/"//g;s/,//')";

    echo "";
    echo "*${appName/protonmail-web/Mail}*:";

    # We ignore commits from the CI
    for commit in $commits; do
        printLine "$commit" "$url";
        ((i+=1))

        # Limit to 25 to prevent too many commits
        if [ "$i" -eq 40 ]; then
            break;
        fi;
    done;
}

##
# Generate a "raw" changelog from all our FE projects linked to the V4
# Clone every repo to extract the changes
function changelogV4 {
    local projects=('proton-contacts' 'proton-mail-settings' 'proton-shared' 'react-components');

    # Get the previous commit as the latest one is the one from the build a few seconfs ago
    local latestCommit="$(cd dist/ && git log -2 --format=%cd --date=iso | tail -1)";

    for project in ${projects[*]}; do
        rm -rf "/tmp/$project" || echo "[$project already exists] /tmp/$project";
        git clone "git@github.com:ProtonMail/$project.git" --depth 30 "/tmp/$project" --quiet &
    done;

    wait;

    generateV4Logs "$latestCommit";

    for project in ${projects[*]}; do
        cd "/tmp/$project" && generateV4Logs "$latestCommit";
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

if [ "$1" = 'changelog-v4' ]; then
    changelogV4;
    exit;
fi;
