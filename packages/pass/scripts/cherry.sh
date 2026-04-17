#!/usr/bin/env bash

BOLD='\033[1m'
DIM='\033[2m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RESET='\033[0m'

truncate() {
  local str="$1" max=$(( ${COLUMNS:-120} - 16 ))
  [[ ${#str} -gt $max ]] && echo "${str:0:$((max-1))}…" || echo "$str"
}

usage() {
  echo ""
  echo -e "  ${BOLD}USAGE:${RESET} $(basename $0) <head-branch> <upstream-branch>"
  echo ""
  echo    "  Lists commits in <head> not yet applied to <upstream>."
  echo    "  Both args accept branches, tags, or SHAs. Ignores i18n-only commits."
  echo ""
  echo    "  EXAMPLES:"
  echo    "    $(basename $0) release/proton-pass@1.36.1 release/proton-pass@1.37.0"
  echo    "    $(basename $0) release/proton-pass@1.36.1 main"
  echo    "    $(basename $0) proton-pass@1.36.1 proton-pass@1.37.0"
  echo ""
}

if [[ "$1" == "--help" || "$1" == "-h" || -z "$1" || -z "$2" ]]; then
  usage; exit 0
fi

HEAD_BRANCH="$1"
UPSTREAM_BRANCH="$2"

# fetch branches and tags separately — git fetch doesn't resolve tags by name alone
fetch_ref() { git fetch -q origin "$1" 2>/dev/null || git fetch -q origin "refs/tags/$1" 2>/dev/null || true; }
fetch_ref "$HEAD_BRANCH"
fetch_ref "$UPSTREAM_BRANCH"

# resolve any ref form (remote branch, tag, SHA) to a full commit SHA
resolve_ref() {
  git rev-parse --verify "refs/remotes/origin/$1" 2>/dev/null \
    || git rev-parse --verify "refs/tags/$1" 2>/dev/null \
    || git rev-parse --verify "$1" 2>/dev/null \
    || { echo "error: cannot resolve '$1'" >&2; exit 1; }
}

HEAD_REF=$(resolve_ref "$HEAD_BRANCH") || exit 1
UPSTREAM_REF=$(resolve_ref "$UPSTREAM_BRANCH") || exit 1

echo ""
echo -e "  commits in ${BOLD}${CYAN}$HEAD_BRANCH${RESET} not yet in ${BOLD}${CYAN}$UPSTREAM_BRANCH${RESET}"
echo ""

subject_matched=0
upstream_subjects=""
base=$(git merge-base "$HEAD_REF" "$UPSTREAM_REF")
upstream_subjects=$(git --no-pager log --format="%s" "$base..$UPSTREAM_REF")

subject_already_upstream() {
  echo "$upstream_subjects" | grep -qF "$1"
}

missing=()
skipped=()

# git cherry matches by patch-ID (normalized diff hash) — safe across cherry-picks.
while IFS= read -r hash; do
  non_i18n=$(git diff-tree --no-commit-id -r --name-only "$hash" \
    | grep -vE '(^locales/|/locales/|\.po$|\.pot$|/i18n/)')

  if [[ -z "$non_i18n" ]]; then
    skipped+=("$hash"); continue
  fi

  subject=$(git --no-pager log --format="%s" -1 "$hash")
  if subject_already_upstream "$subject"; then
    (( subject_matched++ )); continue
  fi

  missing+=("$hash")
done < <(git cherry "$UPSTREAM_REF" "$HEAD_REF" | grep '^+' | awk '{print $2}')

echo -e "  ${DIM}⏭  ${#skipped[@]} skipped (i18n only)${RESET}"
[[ $subject_matched -gt 0 ]] && \
  echo -e "  ${DIM}~  $subject_matched matched by subject${RESET}"

if [[ ${#missing[@]} -eq 0 ]]; then
  echo -e "  ${GREEN}✓  nothing to cherry-pick${RESET}"
  echo ""; exit 0
fi

echo -e "  ${YELLOW}!  ${#missing[@]} missing from ${UPSTREAM_BRANCH}${RESET}"
echo ""
echo -e "  ${BOLD}Commits to cherry-pick${RESET} ${DIM}(oldest first)${RESET}"
echo ""

for hash in "${missing[@]}"; do
  subject=$(git --no-pager log --format="%s" -1 "$hash")
  short=$(git --no-pager log --format="%h" -1 "$hash")
  echo -e "  ${DIM}$short${RESET}  $(truncate "$subject")"
done

echo ""
echo -e "  ${BOLD}Apply:${RESET}"
echo -e "  ${DIM}git cherry-pick ${missing[*]}${RESET}"
echo ""
