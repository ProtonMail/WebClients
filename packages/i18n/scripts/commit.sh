#!/usr/bin/env bash
set -eo pipefail

# Store the ref of the commit we use to build the translations
LAST_COMMIT=$(git rev-parse HEAD);
# Short version, enough to create a unique commit
LAST_COMMIT_SHORT="${LAST_COMMIT:0:12}";

echo;
printf '%-25s' "[LAST_COMMIT]";
printf '%-25s' "$LAST_COMMIT";
echo;
printf '%-25s' "[LAST_COMMIT_SHORT]";
printf '%-25s' "$LAST_COMMIT_SHORT";
echo;
printf '%-25s' "[BRANCH]";
printf '%-25s' "$(git rev-parse --abbrev-ref HEAD)";
echo;

if [ "$3" = 'update' ]; then
    git add -f "$1/template.pot";
    git commit -m "[I18N@$LAST_COMMIT_SHORT] build translation release" -m "Based on the commit: $LAST_COMMIT" || echo "[i18n] Nothing to commit";
    git push origin "$(git rev-parse --abbrev-ref HEAD)" --verbose || echo "[i18n] Nothing to push";
fi

if [ "$3" = 'upgrade' ]; then
    # For both flags we will refresh translations
    git add -f "$1/*.po"
    git add -f "$1/lang.json"
    git add "$2/*.json"
    (git commit -m 'i18n ~ Upgrade translations from crowdin' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] Nothing to upgrade"
fi

if [ "$3" = 'upgrade-website' ]; then
    # For both flags we will refresh translations
    git add -f "$1/*.json"
    git add -f "$1/lang.json"
    git add "$2/*.json"
    (git commit -m 'i18n ~ Upgrade translations from crowdin' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] Nothing to upgrade"
fi
