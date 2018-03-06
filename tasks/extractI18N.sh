#!/bin/bash

COMMAND=./node_modules/.bin/angular-gettext-cli;

echo 'Extracting translations...'

$COMMAND \
    --files './src/+(app|templates)/**/**/*.+(js|html)' \
    --dest po/template.pot \
    --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"

echo '✓ extracing translations'
