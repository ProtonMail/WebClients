#!/usr/bin/env bash

SCRIPT=$(readlink -f "$0")
DIR=$(dirname "$SCRIPT")

if [[ ! -f "${DIR}/localhost-key.pem" || ! -f "${DIR}/localhost.pem" ]]; then
    (
        cd "$DIR"
        ./generate-cert.sh
    )
fi

node "${DIR}/dev-server.js"
