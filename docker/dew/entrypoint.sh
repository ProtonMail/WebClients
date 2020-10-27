#!/usr/bin/env sh
set -eu

API_ENDPOINT="${API_ENDPOINT:-https://mail.protonmail.com/api}"

# Ensure url ends with a /
export API_ENDPOINT="$(echo "$API_ENDPOINT" | sed 's/\/\?$/\//')"

envsubst '${API_ENDPOINT}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

nginx -v
nginx -t
exec "$@"
