#!/bin/bash

COMMAND=./node_modules/.bin/angular-gettext-cli;

for file in $(ls po/*.po)
do
    lang="${file:3:2}";
    $COMMAND \
        --files $file \
        --dest src-tmp/i18n/i18n.${lang}_${lang^^}.json \
        --compile \
        --format json;
done
