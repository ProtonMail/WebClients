#!/bin/bash
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


# Check if the command is valid
if [ -z "$BRANCHES" ]; then
  log "error" "You must pass a list of host to create";
  echo "Exemple:"
  echo -e "\t <cmd> dark,sky"
  echo -e "\t <cmd> dark"
  exit 1;
fi



if [[ "$1" == "--help" ]]; then
    echo "<cmd> target1,target2,target3..."
    echo "It can be only one target: <dmd> monique"
    echo "It will create deploy monique";
    exit 0;
fi;

git checkout master;

for branch in ${BRANCHES[*]} ; do
  echo "Creating branch: deploy-$branch"
  git checkout --orphan "deploy-$branch"
  git rm -rf . --quiet
  git commit --allow-empty -m "Initial commit"
  git push origin "deploy-$branch"
  git checkout "$CURRENT_BRANCH";
done

echo -e "\e[00;42m✔ So long and thanks for all the fish\e[00m"
echo;

