#!/usr/bin/env bash
set -eo pipefail

function getRemote {
    cd /tmp;
    rm -rf "/tmp/$1";
    git clone --depth 1 "git@github.com:ProtonMail/$1.git";
}

function install {
    cd "/tmp/$1";
    if [[ -f "./package-lock.json" ]]; then
        npm ci;
    else
        npm i;
    fi;
}

if [ "$1" = 'clone' ]; then
    getRemote "$2";
fi

if [ "$1" = 'install' ]; then
    install "$2";
fi
