#!/usr/bin/env bash
set -eo pipefail

LIST=();
TOTAL=0;

# Generate hex code for quotes
# echo '"' | od -A n -t x1

##
# Test if we use an invalid format for our translations
# ex: c('Action').t('Salut')
# ex: c('Action').c('Salut')
# ex: c('Action').`Salut`
# ex: c('Action').c`Salut`
function testInvalidFunctionFormat {
    local TEST=$(awk '/c\(\x27.+\x27\)\.(t|c)\(/ {print NR":"$0}' "$1");
    local TEST_2=$(awk '/c\(\x27.+\x27\)\.(c\x60|\x60)/ {print NR":"$0}' "$1");

    if [[ -n "$TEST" ]]; then
        LIST+=("$1");

        echo -e "\e[00;31m[Error] $1 \e[00m"
        echo -e "$TEST";
        echo
        echo -e '👉 You should not use - c(<context>).t(<string>) or c(<context>).c(<string>)'
        echo -e '   but c(<context>).t`<string>` '
        echo

        local total=$(echo -e "$TEST" | wc -l | xargs);
        TOTAL=$(expr $TOTAL + $total)
    fi

    if [[ -n "$TEST_2" ]]; then
        LIST+=("$1");

        echo -e "\e[00;31m[Error] $1 \e[00m"
        echo -e "$TEST_2";
        echo
        echo -e '👉 You should not use - c(<context>).c`<string>` or c(<context>).`<string>`'
        echo -e '   but c(<context>).t`<string>` '
        echo

        local total=$(echo -e "$TEST_2" | wc -l | xargs);
        TOTAL=$(expr $TOTAL + $total)
    fi
}

##
# Test if we use an invalid format for our translations
# ex: c('Action').ngettext(msgid`Day`, 'Days', modifiedValue)
# ex: c('Action').ngettext(msgid`Day`, "Days", modifiedValue)
# ex: c('Action').ngettext(msgid('Day'), "Days", modifiedValue)
function testInvalidFunctionFormatPlural {
    local TEST=$(awk '/\(\x27.+\x27\)\.ngettext\(msgid(\x60|\().+(\x60|\)),\s(\x27|\x22)/ {print NR":"$0}' "$1");
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
