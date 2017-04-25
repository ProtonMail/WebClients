git add -f po/template.pot
(git commit -m 'i18n ~ build translation release' && git push origin $(git rev-parse --abbrev-ref HEAD)) || echo "[i18n] No changes to commit"
