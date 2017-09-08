#!/usr/bin/env sh
set -eu

# This file implements the syntax highlighting of codemirror.
# The reason I'm not doing this in grunt, is that we already have a sieve.js file in /vendor/ (it implements the simple sieve parsing). So I need to give this a new name to get this working.
cp vendor/codemirror/mode/sieve/sieve.js vendor/codemirror/mode/sieve/sieveSyntax.js
# Cannot inject a file from node_modules with the current grunt setup ლ(ಠ益ಠლ
cp -r node_modules/babel-polyfill vendor/babel-polyfill

DEST_BLOB='vendor/blobjs'
DEST_QRCODE='vendor/qrcodejs'
DEST_CSSUA='vendor/cssua'
DEST_MAILPARSER='vendor/mailparser'

rm -rf $DEST_BLOB
rm -rf $DEST_CSSUA
rm -rf $DEST_QRCODE
rm -rf $DEST_MAILPARSER

mkdir $DEST_MAILPARSER
cp src/libraries/mailparser.js vendor/mailparser/mailparser.js

git clone https://github.com/eligrey/Blob.js.git \
  --branch master \
  --single-branch $DEST_BLOB \
  --depth 1

# There is a bower.json but it's not available
git clone https://github.com/mckamey/cssuseragent.git \
  --branch master \
  --single-branch $DEST_CSSUA \
  --depth 1

# Dafuq bower asks for a password
git clone https://github.com/davidshimjs/qrcodejs.git \
  --branch master \
  --single-branch $DEST_QRCODE \
  --depth 1

rm -rf $DEST_BLOB/.git
rm -rf $DEST_CSSUA/.git
rm -rf $DEST_QRCODE/.git

echo
echo
echo "--- custom dependencies installed ---"
echo
