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

echo "[init.project] remote $ARGS" >> build.log;

function getRemote {
    echo "[clone] from git@github.com:ProtonMail/$1.git" >> build.log;
    cd /tmp;
    rm -rf "/tmp/$1";
    git clone --depth 1 "git@github.com:ProtonMail/$1.git";
}

function loadProject {
    if [[ "$ARGS" =~ "$1" ]]; then
        echo "[load.project] remote $2" >> build.log;
        getRemote "$2";
        cd "/tmp/$2";

        # We need the env to be able to deploy
        if [ -d "$ROOT_DIR/$2" ]; then
            # No, no, no, no, no, no, no, no, no, no, no, no there's no limit
            # https://www.youtube.com/watch?v=qM5W7Xn7FiA
            cp $ROOT_DIR/$2/{appConfig,env}.json . 2>/dev/null || :

            echo "[config.project] write from  $ROOT_DIR/$2/{appConfig,env}.json" >> build.log;
            echo "[config.project] write from  $(cat appConfig.json)" >> build.log;

        fi

    else
        echo "[load.project] local $2" >> build.log;
        cd "$ROOT_DIR/$2";
    fi
}

function addSubProject {

    if [ ! -d "./node_modules/react" ]; then
        if [[ -f "./package-lock.json" ]]; then
            npm ci;
        else
            npm i --no-audit --no-package-lock;
        fi;
    fi

    echo "[build.project] npm run build -- $@ "--api=$API" --verbose" >> build.log;
    rm -rf dist;
    npm run build -- $@ "--api=$API" --verbose
    cp -r dist/ "$WEBCLIENT_DIR/$1";
}


echo "[sub.build] $(date)" >> build.log;
echo "[sub.build] $@" >> build.log;
echo "[sub.build] api:$API" >> build.log;

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

echo "" >> build.log;
echo "" >> build.log;
