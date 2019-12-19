#!/usr/bin/env bash
set -eo pipefail

args=("$@");
BRANCHES=(${args//,/ });
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD);

function log {
    if [[ "$1" = *"warn"* ]]; then
      echo
      echo -e "\e[00;35m--------- ⚠ WARNING ⚠ ---------\e[00m";
      echo -e "$2"
      echo
    fi
    if [[ "$1" = *"error"* ]]; then
      echo
      echo -e "\e[00;31m$2\e[00m";
      echo
    fi
    if [[ "$1" = *"success"* ]]; then
      echo -e "\e[00;32m[$2] ✔ $3\e[00m";
      echo
    fi
    if [[ "$1" = *"info"* ]] && $IS_VERBOSE; then
      echo "[$1] - $2";
    fi
}

function contains {
    local branches=$(git ls-remote "$(git remote get-url origin)" | egrep -o 'deploy-(.+)' | sed 's/deploy-//g');

    for branch in ${branches[*]} ; do
        if [ "$branch" = "$1" ]; then
            echo 0;
            return 0;
        fi;
    done;
    echo 1;
}

function create {
    git checkout --orphan "deploy-$1";
    git rm -rf . --quiet;
    git commit --allow-empty -m "Initial commit";
    git push origin "deploy-$1";
    git checkout "$CURRENT_BRANCH";
    git fetch
}

if [ "$1" = '--check' ]; then

    if [ -z "$2" ]; then
        echo "You must set a name. User --check <value>";
        exit 1;
    fi

    echo "Check if the branch deploy-$2 already exists";
    if [[ "$(contains "$2")" = 1 ]]; then
        echo "Creating branch: deploy-$2";
        create "$2";
        echo -e "✔ So long and thanks for all the fish"
        echo;
    fi;
    exit 0;
fi;

# Check if the command is valid if not, ask for branches
if [ -z "$BRANCHES" ]; then
  read -p "Name of the branches to create (deploy-<name>. ex: dark,sky): " BRANCHES;
fi


if [[ "$1" == "--help" ]]; then
    echo "<cmd> target1,target2,target3..."
    echo "It can be only one target: <dmd> monique"
    echo "It will create deploy monique";
    exit 0;
fi;

# git checkout master;

for branch in ${BRANCHES[*]} ; do
    echo "Creating branch: deploy-$branch";
    create "$branch";
done

echo -e "✔ So long and thanks for all the fish"
echo;

