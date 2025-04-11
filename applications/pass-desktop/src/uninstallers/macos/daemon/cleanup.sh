#!/usr/bin/env bash

MAIN_APP="/Applications/Proton Pass.app"
BETA_APP="/Applications/Proton Pass Beta.app"
DATA_DIR="$1"
LOGS_DIR="$2"

# Check if both main app and beta app are gone
if [ ! -d "$MAIN_APP" ] && [ ! -d "$BETA_APP" ]; then
  echo "Apps not found, cleaning up..." >> /tmp/protonpass-cleanup.log

  # Both apps are gone, clean up data
  rm -rf "$DATA_DIR" 2>> /tmp/protonpass-cleanup.log
  rm -rf "$LOGS_DIR" 2>> /tmp/protonpass-cleanup.log

  echo "Cleanup complete, unloading agent..." >> /tmp/protonpass-cleanup.log
  # Remove this launch agent too
  launchctl unload "$HOME/Library/LaunchAgents/com.protonpass.cleanup.plist" 2>/dev/null || true
fi
