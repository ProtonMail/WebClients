DEST_BLOB='vendor/blobjs'
DEST_CSSUA='vendor/cssua'
DEST_QRCODE='vendor/qrcodejs'
DEST_PMCRYPTO='vendor/pmcrypto'
DEST_MAILPARSER='vendor/mailparser'
DEST_BABEL_POLYFILL='vendor/babel-polyfill'

# Remove previous version
rm -rf $DEST_BLOB $DEST_CSSUA $DEST_QRCODE $DEST_PMCRYPTO $DEST_MAILPARSER $DEST_BABEL_POLYFILL


# This file implements the syntax highlighting of codemirror.
# The reason I'm not doing this in grunt, is that we already have a sieve.js file in /vendor/ (it implements the simple sieve parsing). So I need to give this a new name to get this working.
cp vendor/codemirror/mode/sieve/sieve.js vendor/codemirror/mode/sieve/sieveSyntax.js

# Cannot inject a file from node_modules with the current grunt setup ლ(ಠ益ಠლ
cp -r node_modules/cssuseragent $DEST_CSSUA
cp -r node_modules/pmcrypto $DEST_PMCRYPTO
cp -r node_modules/babel-polyfill $DEST_BABEL_POLYFILL

mkdir $DEST_MAILPARSER
cp src/libraries/mailparser.js vendor/mailparser/mailparser.js

git clone git@github.com:eligrey/Blob.js.git \
  --branch master \
  --depth 1 \
  --single-branch $DEST_BLOB

# Checkout last commit
cd $DEST_BLOB && git checkout 079824b6c118fbcd0b99c561d57ad192d2c6619b && cd -

# Dafuq bower asks for a password
git clone git@github.com:davidshimjs/qrcodejs.git \
  --branch master \
  --depth 1 \
  --single-branch $DEST_QRCODE

# Checkout last commit
cd $DEST_QRCODE && git checkout 04f46c6a0708418cb7b96fc563eacae0fbf77674 && cd -

rm -rf $DEST_BLOB/.git $DEST_QRCODE/.git


echo
echo "--- custom dependencies installed ---"
echo
