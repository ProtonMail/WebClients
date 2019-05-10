#!/usr/bin/env bash
set -eo pipefail

function logCommit {
    local branch=$(echo "$1" | awk -F "origin/" '{print $2}');
    local commit=$(git rev-parse "$branch");
    printf '%-20s' "[$branch]";
    printf '%-20s' "$commit";
    echo
}

if [ "$1" = 'prod' ]; then
    for branch in $(git branch -a);
    do
        if [[ ${branch} =~ origin/deploy-prod- ]]; then
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
