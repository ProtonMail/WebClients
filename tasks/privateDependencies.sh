DEST_BLOB='node_modules/pt.blobjs'
DEST_QRCODE='node_modules/pt.qrcodejs'
DEST_MAILPARSER='node_modules/pt.mailparser'
DEST_ASMCRYPTO='node_modules/pt.asmcrypto.js'

# Remove previous version
rm -rf $DEST_QRCODE $DEST_MAILPARSER $DEST_BLOB $DEST_ASMCRYPTO

mkdir $DEST_MAILPARSER
cp src/libraries/mailparser.js $DEST_MAILPARSER/mailparser.js

git clone git@github.com:eligrey/Blob.js.git \
  --branch master \
  --depth 1 \
  --single-branch $DEST_BLOB

# Checkout last commit
cd $DEST_BLOB && git checkout 079824b6c118fbcd0b99c561d57ad192d2c6619b && cd -

# Doesn't work with npm :/
git clone git@github.com:vibornoff/asmcrypto.js.git \
  --branch release \
  --depth 1 \
  --single-branch $DEST_ASMCRYPTO

# Checkout last commit
cd $DEST_ASMCRYPTO && git checkout bfb14fdb4cecebd1ae260ae78e3663b8273120e1 && cd -

# Dafuq bower asks for a password
git clone git@github.com:davidshimjs/qrcodejs.git \
  --branch master \
  --depth 1 \
  --single-branch $DEST_QRCODE

# Checkout last commit
cd $DEST_QRCODE && git checkout 04f46c6a0708418cb7b96fc563eacae0fbf77674 && cd -

rm -rf $DEST_BLOB/.git $DEST_QRCODE/.git $DEST_ASMCRYPTO/.git


echo
echo "--- custom dependencies installed ---"
echo
