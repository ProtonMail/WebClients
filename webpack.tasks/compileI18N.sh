#!/bin/bash

COMMAND=./node_modules/.bin/angular-gettext-cli;

for file in $(ls po/*.po)
do
    lang="${file:3:2}";
    # ${lang^^} doesn't work with Mac OS
    langUpper="$(echo $lang | tr '[a-z]' '[A-Z]')"

    $COMMAND \
        --files $file \
        --dest src/i18n/i18n.${lang}_${langUpper}.json \
        --compile \
        --format json;
done
