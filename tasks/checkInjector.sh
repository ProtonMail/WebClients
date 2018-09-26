#!/usr/bin/env bash
set -eo pipefail

function log {
    if [ "$1" ] && [ "$1" == "modal" ]; then
        echo "⚠ Wrong injector before the controller of the modal ⚠"
    else
        echo "⚠ Wrong injector at the top of the file ⚠";
    fi
}

LIST_MODALS=();
LIST_INJECTORS=();

# Test if our components start with /* ngInject */
function testMainInjection {

    TEST=$(awk '/\/\* @ngInject \*\/\n(function|const \w+)/' RS="" "$1");

    if [[ -z "$TEST" ]]; then
        LIST_INJECTORS+=("$1");
    fi
}


# Test if our modals start with /* ngInject */ before the controller
function testModalInjection {

    if [[ "$1" = *"modal"* ]] || [[ "$1" = *"Modal"* ]] && [[ "$1" != *"pmModal"* ]] && [[ $(grep -F 'pmModal' $file) ]]; then

        TEST=$(awk '/\/\* @ngInject \*\/\n[ ]{8}controller:/' RS="" "$1");

        if [[ -z "$TEST" ]]; then
            LIST_MODALS+=("$1");
        fi
    fi
}

# If we find positives, we display them
function result {
    if [ -n "$LIST_INJECTORS" ]; then
        echo;
        log
        for item in ${LIST_INJECTORS[*]} ; do
            echo  "    ➙ $item"
        done
    fi;

    if [ -n "$LIST_MODALS" ]; then
        echo;
        log 'modal';
        for modal in ${LIST_MODALS[*]} ; do
            echo  "    ➙ $modal"
        done
    fi;
    echo
}

# Check if the code is valid for the current changes or the whole project via --lint
function main {

    # You can lint all the project via the flag --lint
    if [[ "$1" = "--lint" ]]; then
        LIST=$(find src/app -type f -name '*.js' ! -name 'app.js'  ! -name 'appLazy.js' ! -name 'index.js'  ! -name 'routes.js'   ! -name 'config.js'   ! -name 'constants.js'  ! -name 'errors.js'  ! -name 'transformBase.js'  ! -name 'translateAttribute.js'   ! -name 'ptdndconstants.js' ! -path '*helpers*');

        for file in $LIST ; do
            testMainInjection "$file";
            testModalInjection "$file";
        done

        result;

        if [ -n "$LIST_INJECTORS" ] || [ -n "$LIST_MODALS" ]; then
            exit 1;
        fi;
        exit 0;
    fi

    for file in ${BASH_ARGV[*]} ; do
        testMainInjection "$file";
        testModalInjection "$file";
    done

    result
}

main "$1"
