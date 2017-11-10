DEST_MAILPARSER='node_modules/pt.mailparser'
DEST_VCARD='node_modules/vcard'

# Remove previous version
rm -rf $DEST_MAILPARSER $DEST_VCARD

mkdir $DEST_MAILPARSER
cp src/libraries/mailparser.js $DEST_MAILPARSER/mailparser.js

mkdir $DEST_VCARD
npx browserify node_modules/vcf/lib/vcard.js --standalone vCard -o node_modules/vcard/vcard.js

echo
echo "--- custom dependencies installed ---"
echo
