#!/bin/bash

COMMAND=./node_modules/.bin/angular-gettext-cli;

echo 'Extracting translations...'

$COMMAND \
    --files './src-tmp/+(app|templates)/**/**/*.+(js|html)' \
    --dest po/i18n.pot \
    --attributes "placehoder-translate","title-translate","pt-tooltip-translate","translate"

echo '✓ extracing translations'
