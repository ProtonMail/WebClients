#!/bin/bash
set -eo pipefail

COMMAND=./node_modules/.bin/uglifyjs;

#
#  Process
#  1. Minify vendor*
#  2. Compute hash for
#       - openpgp
#       - openpgp.worker
#       - appLazy
#       - styles
#  3. Rename styles, vendorLazy* + sourcemaps
#  4. Edit in place hashes
#       - hash for the sourcemap inside appLazy
#       - hash for openpgp inside openpgp.worker
#       - hash for openpgp.worker inside vendor
#  5. Compute new hash for
#       - vendor
#  6. Edit in place hashes
#       - hash for vendors* inside app.js
#       - hash for appLazy inside app.js
#  7. Bind assets inside index.html
#  8. Rename files
#  9. Done
#

# Edit in place hash for items
function replace {
    # Mac OS non-standard
    if [[ "$OSTYPE" = "darwin"* ]]; then
        sed -i '' $1 $2
    else
        sed -i $1 $2
    fi
}

function minify {
    if [ -e "./dist/$1.js" ]; then
        echo " → minify $1";
        $COMMAND --compress --mangle -o dist/$1.js -- dist/$1.js &
    fi
}

echo " → Minify vendors + vendorsLazy"

minify vendor
minify vendorLazy
minify vendorLazy2
wait

echo " ✓ Minify vendors + vendorsLazy success"
echo
echo " → Compute shasum for bundles"

HASH_APP_LAZY=$(shasum dist/appLazy.js | awk '{print  $1}');
HASH_VENDOR_LAZY=$(shasum dist/vendorLazy.js | awk '{print  $1}');
HASH_VENDOR_LAZY2=$(shasum dist/vendorLazy2.js | awk '{print  $1}');
HASH_STYLE=$(shasum dist/styles.css | awk '{print  $1}');

# OpenPGP files won't change, so we can calculate their hash here
HASH_OPENPGP=$(shasum dist/openpgp.min.js | awk '{print  $1}');
HASH_OPENPGP_COMPAT=$(shasum dist/openpgp_compat.min.js | awk '{print  $1}');

echo " → Replace shasum in place"

replace "s/appLazy.js.map/appLazy.$HASH_APP_LAZY.js.map/g;" dist/appLazy.js;
replace "s/openpgp.min.js/openpgp.$HASH_OPENPGP.js/g;"  dist/openpgp.worker.min.js
replace "s/openpgp.min.js/openpgp_compat.$HASH_OPENPGP.js/g;"  dist/openpgp_compat.worker.min.js

# Calculate the hash of the workers after we have changed their files
HASH_WORKER=$(shasum dist/openpgp.worker.min.js | awk '{print  $1}');
HASH_WORKER_COMPAT=$(shasum dist/openpgp_compat.worker.min.js | awk '{print  $1}');

echo " → Checksum for app + vendor"

HASH_VENDOR=$(shasum dist/vendor.js | awk '{print  $1}');

# Replace assets for lazyLoad inside the app.js. Single source of truth
replace "s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g;s/openpgp.worker.min.js/openpgp.worker.$HASH_WORKER.js/g;s/openpgp_compat.worker.min.js/openpgp_compat.worker.$HASH_WORKER_COMPAT.js/g;" dist/app.js;

# No more updates, let's create its hash
HASH_APP=$(shasum dist/app.js | awk '{print  $1}');

replace "s/app.js.map/app.$HASH_APP.js.map/g;" dist/app.js;

# Last step update index.html with assets
replace "s/app.js/app.$HASH_APP.js/g;s/appLazy.js/appLazy.$HASH_APP_LAZY.js/g;s/styles.css/styles.$HASH_STYLE.css/g;s/vendor.js/vendor.$HASH_VENDOR.js/g;s/vendorLazy.js/vendorLazy.$HASH_VENDOR_LAZY.js/g;s/vendorLazy2.js/vendorLazy2.$HASH_VENDOR_LAZY2.js/g;s/openpgp.min.js/openpgp.$HASH_OPENPGP.js/g;s/openpgp_compat.min.js/openpgp_compat.$HASH_OPENPGP_COMPAT.js/g;" dist/index.html;

echo " → Write new files"
echo

mv dist/appLazy.js dist/appLazy.$HASH_APP_LAZY.js
mv dist/appLazy.js.map dist/appLazy.$HASH_APP_LAZY.js.map
mv dist/vendorLazy.js dist/vendorLazy.$HASH_VENDOR_LAZY.js
mv dist/vendorLazy2.js dist/vendorLazy2.$HASH_VENDOR_LAZY2.js
mv dist/styles.css dist/styles.$HASH_STYLE.css
mv dist/openpgp.min.js dist/openpgp.$HASH_OPENPGP.js
mv dist/openpgp.worker.min.js dist/openpgp.worker.$HASH_WORKER.js
mv dist/openpgp_compat.min.js dist/openpgp_compat.$HASH_OPENPGP_COMPAT.js
mv dist/openpgp_compat.worker.min.js dist/openpgp_compat.worker.$HASH_WORKER_COMPAT.js
mv dist/vendor.js dist/vendor.$HASH_VENDOR.js
mv dist/app.js dist/app.$HASH_APP.js
mv dist/app.js.map dist/app.$HASH_APP.js.map
rm dist/html.js

echo HASH_APP $HASH_APP
echo HASH_VENDOR $HASH_VENDOR
echo HASH_STYLE $HASH_STYLE
echo HASH_APP_LAZY $HASH_APP_LAZY
echo HASH_VENDOR_LAZY $HASH_VENDOR_LAZY
echo HASH_VENDOR_LAZY2 $HASH_VENDOR_LAZY2
echo HASH_OPENPGP $HASH_OPENPGP
echo HASH_WORKER $HASH_WORKER
echo HASH_OPENPGP_COMPAT $HASH_OPENPGP_COMPAT
echo HASH_WORKER_COMPAT $HASH_WORKER_COMPAT

echo
echo " ✓ Write shasum success"
