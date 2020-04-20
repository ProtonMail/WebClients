#!/usr/bin/env sh
set -eu

API_ENDPOINT="${API_ENDPOINT:-https://mail.protonmail.com/api}"
BASE_OTHER_FE_APPS="${BASE_OTHER_FE_APPS:-https://proton.qa}"

# Ensure url ends with a /
export API_ENDPOINT="$(echo "$API_ENDPOINT" | sed 's/\/\?$/\//')"
export BASE_OTHER_FE_APPS="$(echo "$BASE_OTHER_FE_APPS" | sed 's/\/\?$/\//')"

envsubst '${API_ENDPOINT} ${BASE_OTHER_FE_APPS}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

nginx -v
nginx -t
exec "$@"
