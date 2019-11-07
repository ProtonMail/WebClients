#!/usr/bin/env bash
set -eo pipefail

LIST=();
TOTAL=0;

##
# Test if we use an invalid format for our translations
# ex: c('Action').t('Salut')
function testInvalidFunctionFormat {
    local TEST=$(awk '/c\(\x27.+\x27\)\.t\(/ {print NR":"$0}' "$1");

    if [[ -n "$TEST" ]]; then
        LIST+=("$1");

        echo -e "\e[00;31m[Error] $1 \e[00m"
        echo -e "$TEST";
        echo
        echo -e '👉 You should not use - t(<string>) - but t`<string>` '
        echo

        local total=$(echo -e "$TEST" | wc -l | xargs);
        TOTAL=$(expr $TOTAL + $total)
    fi
}

##
# Test if we use an invalid format for our translations
# ex: c('Action').ngettext(msgid`Day`, 'Days', modifiedValue)
function testInvalidFunctionFormatPlural {
    local TEST=$(awk '/\(\x27.+\x27\)\.ngettext\(msgid`.+`,\s\x27/ {print NR":"$0}' "$1");
    if [[ -n "$TEST" ]]; then
        LIST+=("$1");

        echo -e "\e[00;31m[Error] $1 \e[00m"
        echo -e "$TEST";
        echo
        echo -e '👉 Plural form is  - ngettext(msgid`<string single>`, `<string plural>`, value) ';
        echo

        local total=$(echo -e "$TEST" | wc -l | xargs);
        TOTAL=$(expr $TOTAL + $total)
    fi
}


for file in $(find "${1:-src/app}" -type f -name "*.js" -o -name '*.ts' -o -name '*.tsx' -not -path "./node_modules/*");
do
    testInvalidFunctionFormat "$file";
    testInvalidFunctionFormatPlural "$file";
done;


if [ -n "$LIST" ]; then
    echo
    echo "Found $TOTAL error(s) inside ${#LIST[@]} file(s)";
    exit 1;
fi;
