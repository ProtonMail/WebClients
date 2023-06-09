#!/usr/bin/env sh

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR="$SCRIPT_DIR/.."
OUT_DIR="$ROOT_DIR"/fathom/protonpass-fathom

SUCCESS='\033[0;32m'
ERROR='\033[0;33m'
INFO='\033[0;34m'
NOCOLOR='\033[0m'

sync() {
    if [[ -z "${PROTONPASS_FATHOM_DIR}" ]]; then
        echo "${ERROR}Environment variable PROTONPASS_FATHOM_DIR not set."
        echo "Ensure you locally pull the protonpass-fathom repository before running this command"
        return 0
    else
        echo "${INFO}Building Proton Pass Fathom $NOCOLOR"
        (
            cd ${PROTONPASS_FATHOM_DIR}
            yarn build
        )
        rm -rf OUT_DIR
        cp $(find $PROTONPASS_FATHOM_DIR/dist -name "index.js" -o -name "index.d.ts" -o -name "fathom.js") $OUT_DIR
        echo "${SUCCESS}Proton Pass Fathom synced"
    fi
}

sync
