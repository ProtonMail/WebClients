#!/bin/bash

COMMAND=./node_modules/.bin/uglifyjs;

echo " → Minify vendors + vendorsLazy"

$COMMAND --compress --mangle -o dist/vendor.js -- dist/vendor.js &
$COMMAND --compress --mangle -o dist/vendorLazy.js -- dist/vendorLazy.js &
$COMMAND --compress --mangle -o dist/vendorLazy2.js -- dist/vendorLazy2.js &
wait
echo " ✓ Minify vendors + vendorsLazy success"
echo
echo " → Compute shasum for bundles"

HASH_APP=$(shasum dist/app.js | awk '{print  $1}');
HASH_APP_LAZY=$(shasum dist/appLazy.js | awk '{print  $1}');
HASH_VENDOR=$(shasum dist/vendor.js | awk '{print  $1}');
HASH_VENDOR_LAZY=$(shasum dist/vendorLazy.js | awk '{print  $1}');
HASH_VENDOR_LAZY2=$(shasum dist/vendorLazy2.js | awk '{print  $1}');
HASH_STYLE=$(shasum dist/styles.css | awk '{print  $1}');
HASH_TEMPLATE=$(shasum dist/templates.js | awk '{print  $1}');
HASH_OPENPGP=$(shasum dist/openpgp.min.js | awk '{print  $1}');

CONTENT=$(sed -e "s/templates.js/templates.$HASH_TEMPLATE.js/g;s/app.js/app.$HASH_APP.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g;s/styles.css/styles.$HASH_STYLE.css/g;s/vendor.js/vendor.$HASH_VENDOR.js/g;s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/openpgp.min.js/openpgp.min.js?rel=$HASH_OPENPGP/g" dist/index.html)
CONTENT_APP=$(sed -e "s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g" dist/app.js)

echo HASH_STYLE $HASH_STYLE
echo HASH_TEMPLATE $HASH_TEMPLATE
echo HASH_APP $HASH_APP
echo HASH_APP_LAZY $HASH_APP_LAZY
echo HASH_VENDOR $HASH_VENDOR
echo HASH_VENDOR_LAZY $HASH_VENDOR_LAZY
echo HASH_VENDOR_LAZY2 $HASH_VENDOR_LAZY2
# Don't rename the file => else the worker is broken
echo HASH_OPENPGP $HASH_OPENPGP

echo
echo " → Attach shasum to files"
mv dist/app.js dist/app.$HASH_APP.js
mv dist/appLazy.js dist/appLazy.$HASH_APP_LAZY.js
mv dist/vendor.js dist/vendor.$HASH_VENDOR.js
mv dist/vendorLazy.js dist/vendorLazy.$HASH_VENDOR_LAZY.js
mv dist/vendorLazy2.js dist/vendorLazy2.$HASH_VENDOR_LAZY2.js
mv dist/templates.js dist/templates.$HASH_TEMPLATE.js
mv dist/styles.css dist/styles.$HASH_STYLE.css

echo " → Write shasum"
echo $CONTENT > dist/index.html
echo $CONTENT_APP > dist/app.$HASH_APP.js
echo " ✓ Write shasum success"
echo
