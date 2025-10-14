#!/bin/bash
set -e

APP_VERSION=$(node -p "require('./package.json').version")
APP_DEB_PATH="./out/make/deb/x64/proton-mail_${APP_VERSION}_amd64.deb"

echo "Building snap"
echo "APP_VERSION: $APP_VERSION"
echo "APP_DEB_PATH: $APP_DEB_PATH"

sed -e "s/\$APP_VERSION/$APP_VERSION/g" \
    -e "s|\$APP_DEB_PATH|$APP_DEB_PATH|g" \
    ./snapcraft.yaml.template > ./snap/snapcraft.yaml
