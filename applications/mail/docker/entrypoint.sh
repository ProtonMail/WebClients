#!/usr/bin/env sh
set -eu

API_ENDPOINT="${API_ENDPOINT:-https://mail.protonmail.com/api/}"
BASE_OTHER_FE_APPS="${BASE_OTHER_FE_APPS:-https://beta.protonmail.com/}"
BASE_OTHER_FE_APPS="$(echo "$BASE_OTHER_FE_APPS" | sed 's/\/\?$/\//')"

CALENDAR_ENDPOINT="${CALENDAR_ENDPOINT:-${BASE_OTHER_FE_APPS}calendar/}"
CONTACTS_ENDPOINT="${CONTACTS_ENDPOINT:-${BASE_OTHER_FE_APPS}contacts/}"
SETTINGS_ENDPOINT="${SETTINGS_ENDPOINT:-${BASE_OTHER_FE_APPS}settings/}"

# Ensure url ends with a /
export API_ENDPOINT="$(echo "$API_ENDPOINT" | sed 's/\/\?$/\//')"
export CALENDAR_ENDPOINT="$(echo "$CALENDAR_ENDPOINT" | sed 's/\/\?$/\//')"
export CONTACTS_ENDPOINT="$(echo "$CONTACTS_ENDPOINT" | sed 's/\/\?$/\//')"
export SETTINGS_ENDPOINT="$(echo "$SETTINGS_ENDPOINT" | sed 's/\/\?$/\//')"

envsubst '${API_ENDPOINT} ${CALENDAR_ENDPOINT} ${CONTACTS_ENDPOINT} ${SETTINGS_ENDPOINT}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

nginx -v
nginx -t
exec "$@"
