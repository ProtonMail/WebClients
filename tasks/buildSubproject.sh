#!/usr/bin/env bash
set -eo pipefail

function loadEnv {
    set -o allexport
    source "$1";
    set +o allexport
}

if [ -f "env/.env" ]; then
    loadEnv "env/.env";
    echo ""
    echo "⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠ [DEPRECATION NOTICE] ⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠"
    echo " Plz copy your file env/.env to the .env"
    echo "⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠ [/DEPRECATION NOTICE] ⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠"
    echo ""
    echo ""
fi;

if [ -f ".env" ]; then
    loadEnv ".env";
fi;

if [ -z "$ROOT_DIR" ]; then
    echo "Missing [ROOT_DIR] inside env/.env file, to create one plz open the link below";
    echo "You will find inside an ex of the config."
    echo "https://github.com/ProtonMail/protonmail-settings#where-should-i-should-i-clone-them-"
    echo
    exit 1;
fi;


WEBCLIENT_DIR="$ROOT_DIR/${WEBCLIENT_APP:-Angular}";

# Output dir where we will store the dist version of protonmail-settings.
# dist/settings will allow us to access to mail.protonmail.com/settings with protonmail-settings
SETTINGS_DIST_DIR="dist/settings";
CONTACTS_DIST_DIR="dist/contacts";

function addSubProject {
    cd "$ROOT_DIR/$1";

    if [ ! -d "./node_modules/react" ]; then
        npm ci;
    fi

    rm -rf dist;
    npm run build -- $@
    cp -r dist/ "$WEBCLIENT_DIR/$2";
}

if [[ "$*" == *--deploy-subproject=settings* ]]; then
    addSubProject "${SETTINGS_APP:-protonmail-settings}" "$SETTINGS_DIST_DIR";
fi

if [[ "$*" == *--deploy-subproject=contacts* ]]; then
    addSubProject "${CONTACTS_APP:-protonmail-contacts}" "$CONTACTS_DIST_DIR";
fi
