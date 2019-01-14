#!/usr/bin/env bash
set -eo pipefail

if [ "$1" = '--update' ]; then
    git add -f po/template.pot
    (git commit -m 'i18n ~ build translation release' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] No changes to commit"
fi

if [ "$1" = '--upgrade' ]; then
    # For both flags we will refresh translations
    git add -f po/*.po
    git add -f po/lang.json
    git add src/i18n/*.json
    (git commit -m 'i18n ~ Upgrade translations from crowdin' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] Nothing to upgrade"
fi
