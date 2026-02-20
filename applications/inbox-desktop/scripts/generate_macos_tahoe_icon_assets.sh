#!/bin/sh

# Based on: https://www.hendrik-erz.de/post/supporting-liquid-glass-icons-in-apps-without-xcode.
# Uses 'actool' to compile an asset catalog into a single binary `Assets.car` which is used
# for the new icon support in macOS26+.

echo "Are you running from /applications/inbox-desktop? (y/n)"
read -r answer

if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "Exiting..."
    exit 1
fi

ICON_PATH="./assets/macos/Mail.icon/"
OUTPUT_PATH="./assets/macos/tahoe-icon/"
PLIST_PATH="$OUTPUT_PATH/assetcatalog_generated_info.plist"
DEVELOPMENT_REGION="en"

actool "$ICON_PATH" --compile "$OUTPUT_PATH" \
    --output-format human-readable-text \
    --output-partial-info-plist "$PLIST_PATH" \
    --app-icon MyApp --include-all-app-icons \
    --enable-on-demand-resources NO \
    --development-region "$DEVELOPMENT_REGION" \
    --target-device mac \
    --minimum-deployment-target 26.0 \
    --platform macosx

rm "$PLIST_PATH"
