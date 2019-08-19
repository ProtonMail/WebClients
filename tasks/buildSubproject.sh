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

# Extract API flag and fallback default if it doesn't exist
API_FLAG=$(echo "$@" | awk 'match($0, /--api=(\w{3,4})/) {
    print substr($0, RSTART, RLENGTH)
}' | awk -F '=' '{print $2}');
API="${API_FLAG:-build}";

# Output dir where we will store the dist version of protonmail-settings.
# dist/settings will allow us to access to mail.protonmail.com/settings with protonmail-settings
SETTINGS_DIST_DIR="dist/settings";
CONTACTS_DIST_DIR="dist/contacts";
CALENDAR_DIST_DIR="dist/calendar";

function addSubProject {
    cd "$ROOT_DIR/$1";

    if [ ! -d "./node_modules/react" ]; then
        npm ci;
    fi

    rm -rf dist;
    npm run build -- $@ "--api=$API"
    cp -r dist/ "$WEBCLIENT_DIR/$2";
}

echo "[sub.build] $@" >> build.log;
echo "[sub.build.api] $API" >> build.log;

if [[ "$*" == *--deploy-subproject=settings* ]]; then
    echo "[build] settings" >> build.log;
    addSubProject "${SETTINGS_APP:-protonmail-settings}" "$SETTINGS_DIST_DIR";
fi

if [[ "$*" == *--deploy-subproject=contacts* ]]; then
    echo "[build] contacts" >> build.log;
    addSubProject "${CONTACTS_APP:-proton-contacts}" "$CONTACTS_DIST_DIR" ;
fi

if [[ "$*" == *--deploy-subproject=calendar* ]]; then
    echo "[build] calendar" >> build.log;
    addSubProject "${CALENDAR_APP:-proton-calendar}" "$CALENDAR_DIST_DIR";
fi
