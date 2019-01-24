#!/usr/bin/env bash
set -eo pipefail

# Store the ref of the commit we use to build the translations
LAST_COMMIT=$(git rev-parse HEAD);
# Short version, enough to create a unique commit
LAST_COMMIT_SHORT="${LAST_COMMIT:0:12}";

if [ "$1" = '--update' ]; then
    git add -f po/template.pot
    (git commit -m "[I18N@$LAST_COMMIT_SHORT] build translation release" -m "Based on the commit: $LAST_COMMIT" && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] No changes to commit"
fi

if [ "$1" = '--upgrade' ]; then
    # For both flags we will refresh translations
    git add -f po/*.po
    git add -f po/lang.json
    git add src/i18n/*.json
    (git commit -m 'i18n ~ Upgrade translations from crowdin' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] Nothing to upgrade"
fi
