#!/bin/bash
set -eo pipefail

DEST_MAILPARSER='node_modules/pt.mailparser'

# Remove previous version
rm -rf $DEST_MAILPARSER
mkdir $DEST_MAILPARSER
cp src/libraries/mailparser.js $DEST_MAILPARSER/mailparser.js
