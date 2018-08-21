#!/bin/bash
set -eo pipefail

DEST_FILE="ProtonMail Web Application.pot"
TEMPLATE_FILE=template.pot
CROWDIN_KEY_API=$(cat env/.env | grep CROWDIN_KEY_API | awk -F '=' '{ print $2 }')

if [ -z "$CROWDIN_KEY_API" ]; then
  echo "You must have env/.env to deploy. Cf: https://github.com/ProtonMail/Angular/wiki/Crowdin"
  exit 1
fi

echo "Uploading $TEMPLATE_FILE file"

curl \
  -F "files[/$DEST_FILE]=@po/$TEMPLATE_FILE" \
  https://api.crowdin.com/api/project/protonmail/update-file?key=$CROWDIN_KEY_API

echo "Done!"