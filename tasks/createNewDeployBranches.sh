#!/bin/bash
set -eo pipefail

args=("$@");
BRANCHES=(${args//,/ });

if [[ "$1" == "--help" ]]; then
    echo "<cmd> target1,target2,target3..."
    echo "It can be only one target: <dmd> monique"
    echo "It will create deploy monique";
    exit 0;
fi;

git checkout v3;

for branch in ${BRANCHES[*]} ; do
  echo "Creating branch: deploy-$branch"
  git checkout --orphan "deploy-$branch"
  git rm -rf . --quiet
  git commit --allow-empty -m "Initial commit"
  git push origin "deploy-$branch"
  git checkout v3;
done

echo -e "\e[00;42m✔ So long and thanks for all the fish\e[00m"
echo;

