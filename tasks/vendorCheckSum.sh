#!/bin/bash
set -eo pipefail

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
HASH_OPENPGP=$(shasum dist/openpgp.min.js | awk '{print  $1}');

echo HASH_STYLE $HASH_STYLE
echo HASH_APP $HASH_APP
echo HASH_APP_LAZY $HASH_APP_LAZY
echo HASH_VENDOR $HASH_VENDOR
echo HASH_VENDOR_LAZY $HASH_VENDOR_LAZY
echo HASH_VENDOR_LAZY2 $HASH_VENDOR_LAZY2
# Don't rename the file => else the worker is broken
echo HASH_OPENPGP $HASH_OPENPGP

echo
echo " → Attach shasum to files"
mv dist/index.html dist/app.html
mv dist/app.js.map dist/app.$HASH_APP.js.map
mv dist/appLazy.js.map dist/appLazy.$HASH_APP_LAZY.js.map
mv dist/vendor.js dist/vendor.$HASH_VENDOR.js
mv dist/vendorLazy.js dist/vendorLazy.$HASH_VENDOR_LAZY.js
mv dist/vendorLazy2.js dist/vendorLazy2.$HASH_VENDOR_LAZY2.js
mv dist/styles.css dist/styles.$HASH_STYLE.css

echo " → Write shasum"

sed -e "s/app.js/app.$HASH_APP.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g;s/styles.css/styles.$HASH_STYLE.css/g;s/vendor.js/vendor.$HASH_VENDOR.js/g;s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/openpgp.min.js/openpgp.min.js?rel=$HASH_OPENPGP/g" < dist/app.html > dist/index.html;
sed -e "s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g;s/app.js.map/app.$HASH_APP.js.map/g;" < dist/app.js > dist/app.$HASH_APP.js;
sed -e "s/appLazy.js.map/appLazy.$HASH_APP_LAZY.js.map/g;" < dist/appLazy.js > dist/appLazy.$HASH_APP_LAZY.js;

rm dist/{app.html,app.js,appLazy.js,html.js};
echo " ✓ Write shasum success"
echo
