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
ARGS="$*";


echo "[sub.build] $(date)" >> build.log;
echo "[sub.build] $@" >> build.log;
echo "[sub.build] api:$API" >> build.log;
echo "[init.project] $API_FLAG" >> build.log;
echo "[init.project] remote $ARGS" >> build.log;

function getRemote {
    echo "[clone] from git@github.com:ProtonMail/$1.git" >> build.log;
    cd /tmp;
    rm -rf "/tmp/$1";
    git clone --depth 1 "git@github.com:ProtonMail/$1.git";
}

function loadProject {

    if [ ! -d "/tmp/app-config" ]; then
        git clone --depth 1 "$APP_CONFIG_REPOSITORY" /tmp/app-config
    fi;

    if [[ "$ARGS" =~ "$1" ]]; then
        echo "[load.project] remote $2" >> build.log;
        getRemote "$2";
        cd "/tmp/$2";

        echo "[config.project] load from /tmp/$2" >> build.log;
        /tmp/app-config/install "/tmp/$2" --verbose
        echo "[config.project] loaded" >> build.log;
        cat "/tmp/$2/appConfig.json" >> build.log;
    else
        echo "[load.project] local $2" >> build.log;
        cd "$ROOT_DIR/$2";
    fi
}

function addSubProject {

    if [ ! -d "./node_modules/react" ]; then
        if [[ -f "./package-lock.json" ]]; then
            npm --no-color ci;
        else
            npm --no-color i --no-audit --no-package-lock;
        fi;
    fi

    echo "[build.project] npm run build -- $@ "--api=$API" --verbose" >> build.log;
    rm -rf dist;
    npm --no-color run build -- $@ "--api=$API" --verbose
    cp -r dist/ "$WEBCLIENT_DIR/$1";
}

if [[ "$*" == *--deploy-subproject=settings* ]]; then
    echo "[build] settings" >> build.log;
    loadProject "--remote-pm-settings" "${SETTINGS_APP:-proton-mail-settings}";
    addSubProject "$SETTINGS_DIST_DIR";
fi

if [[ "$*" == *--deploy-subproject=contacts* ]]; then
    echo "[build] contacts" >> build.log;
    loadProject "--remote-contacts" "${CONTACTS_APP:-proton-contacts}";
    addSubProject "$CONTACTS_DIST_DIR";
fi

if [[ "$*" == *--deploy-subproject=calendar* ]]; then
    echo "[build] calendar" >> build.log;
    loadProject "--remote-calendar" "${CALENDAR_APP:-proton-calendar}";
    addSubProject "$CALENDAR_DIST_DIR";
fi

echo -e "\n" >> build.log
echo -e "\n" >> build.log
echo "[awk] $(awk --version)" >> build.log
echo -e "\n" >> build.log
