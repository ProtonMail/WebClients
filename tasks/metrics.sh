#!/bin/bash

if [[ ! $(git rev-parse --abbrev-ref HEAD | grep deploy) ]]; then
    jsFiles=$(git diff --cached --name-only --diff-filter=ACM "*.js" "*.jsx" | tr '\n' ' ')
    [ -z "$jsFiles" ] && exit 0

    echo "$jsFiles" | xargs ./node_modules/.bin/cqc --verbose --complexity-max=5

    echo

    echo "$jsFiles" | xargs ./tasks/checkInjector.sh

    npx lint-staged;
fi;


