#!/bin/bash
set -eo pipefail

git add -f po/template.pot
git add -f po/lang.json
git add -f po/lang-moment.json
(git commit -m 'i18n ~ build translation release' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] No changes to commit"

git add src/i18n/*.json
(git commit -m 'i18n ~ build translation app' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] No changes for app to commit"
