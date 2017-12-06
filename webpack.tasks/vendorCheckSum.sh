#!/bin/bash

HASH_STYLE=$(shasum dist/styles.css | awk '{print  $1}');
HASH_VENDOR=$(shasum dist/vendor.js | awk '{print  $1}');
HASH_OPENPGP=$(shasum dist/openpgp.min.js | awk '{print  $1}');

CONTENT=$(sed -e "s/styles.css/styles.$HASH_STYLE.css/g;s/vendor.js/vendor.$HASH_VENDOR.js/g;s/openpgp.min.js/openpgp.min.js?rel=$HASH_OPENPGP/g" dist/index.html)

echo HASH_STYLE $HASH_STYLE
echo HASH_VENDOR $HASH_VENDOR
echo HASH_OPENPGP $HASH_OPENPGP

mv dist/vendor.js dist/vendor.$HASH_VENDOR.js
mv dist/styles.css dist/styles.$HASH_STYLE.css

echo $CONTENT > dist/index.html
