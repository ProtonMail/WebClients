#!/bin/bash

HASH_VENDOR=$(shasum dist/styles.css | awk '{print  $1}');
HASH_VENDOR=$(shasum dist/vendor.js | awk '{print  $1}');
HASH_OPENPGP=$(shasum dist/openpgp.min.js | awk '{print  $1}');

mv dist/vendor.js dist/vendor.$HASH_VENDOR.js
mv dist/styles.css dist/styles.$HASH_VENDOR.css
sed -i "s/styles.css/styles.$HASH_VENDOR.css/g" dist/index.html
sed -i "s/vendor.js/vendor.$HASH_VENDOR.js/g" dist/index.html
sed -i "s/openpgp.min.js/openpgp.min.js?rel=$HASH_OPENPGP/g" dist/index.html

