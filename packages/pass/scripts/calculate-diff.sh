#!/bin/bash

usage() {
  echo ""
  echo "USAGE: $(basename $0) <release-branch> [main-branch]"
  echo ""
  echo "  Checks which commits in a release branch are not yet in main."
  echo "  Ignores locales/ changes and already cherry-picked commits."
  echo ""
  echo "EXAMPLES:"
  echo "  $(basename $0) IDTEAM-1.36.0-release"
  echo "  $(basename $0) IDTEAM-1.36.0-release develop"
  echo ""
}

if [[ "$1" == "--help" || "$1" == "-h" || -z "$1" ]]; then
  usage
  exit 0
fi

RELEASE_BRANCH="$1"
MAIN_BRANCH="${2:-main}"

if ! git show-ref --verify --quiet refs/heads/$MAIN_BRANCH; then
  echo "Error: branch '$MAIN_BRANCH' does not exist."; exit 1
fi
if ! git show-ref --verify --quiet refs/heads/$RELEASE_BRANCH; then
  echo "Error: branch '$RELEASE_BRANCH' does not exist."; exit 1
fi

base=$(git merge-base $MAIN_BRANCH $RELEASE_BRANCH)
echo "Common ancestor: $base"

total=$(git log $base..$RELEASE_BRANCH --oneline --no-merges | wc -l | tr -d ' ')
i=0
rm -f /tmp/results.txt

echo "Checking $total commits..."
echo "------------------------------------------------------------"

git log $base..$RELEASE_BRANCH --oneline --no-merges | awk '{print $1}' | while read hash; do
  i=$((i + 1))
  msg=$(git log --oneline -1 $hash)
  echo "[$i/$total] $msg"

  # skip locales-only commits
  files=$(git diff-tree --no-commit-id -r --name-only $hash | grep -v '^locales/')
  if [ -z "$files" ]; then
    echo "  -> skipped (locales only)"
    echo "$hash SKIPPED" >> /tmp/results.txt
    continue
  fi

  # for each non-locale file, check if its changes exist in main
  all_found=true
  for file in $files; do
    git show $hash -- $file | grep '^[+-]' | grep -v '^[+-][+-][+-]' > /tmp/commit_patch.txt
    git log $base..$MAIN_BRANCH -p -- $file | grep '^[+-]' | grep -v '^[+-][+-][+-]' > /tmp/main_patch.txt

    if [ ! -s /tmp/commit_patch.txt ]; then
      continue
    fi

    if ! grep -qFf /tmp/commit_patch.txt /tmp/main_patch.txt; then
      all_found=false
      break
    fi
  done

  if $all_found; then
    echo "  -> already in $MAIN_BRANCH"
    echo "$hash FOUND" >> /tmp/results.txt
  else
    echo "  -> NOT in $MAIN_BRANCH"
    echo "$hash MISSING" >> /tmp/results.txt
  fi
done

echo "------------------------------------------------------------"
echo "Summary:"
echo "  Already in $MAIN_BRANCH: $(grep -c FOUND /tmp/results.txt)"
echo "  Skipped (locales only):  $(grep -c SKIPPED /tmp/results.txt)"
echo "  NOT in $MAIN_BRANCH:     $(grep -c MISSING /tmp/results.txt)"
echo ""
echo "Commits to cherry-pick:"
grep MISSING /tmp/results.txt | awk '{print $1}' | while read hash; do
  git --no-pager log --oneline -1 $hash
done
