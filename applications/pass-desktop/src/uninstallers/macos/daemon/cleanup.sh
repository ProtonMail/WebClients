#!/usr/bin/env bash

MAIN_APP="/Applications/Proton Pass.app"
BETA_APP="/Applications/Proton Pass Beta.app"
PLIST_PATH="$HOME/Library/LaunchAgents/com.protonpass.cleanup.plist"

DATA_DIR="$1"
LOGS_DIR="$2"

# Check if both main app and beta app are gone
if [ ! -d "$MAIN_APP" ] && [ ! -d "$BETA_APP" ]; then
    echo "$(date): Apps not found, cleaning up..." >>/tmp/protonpass-cleanup.log

    # Both apps are gone, clean up data
    rm -rf "$DATA_DIR" 2>>/tmp/protonpass-cleanup.log
    rm -rf "$LOGS_DIR" 2>>/tmp/protonpass-cleanup.log

    echo "$(date): Cleanup complete, unloading agent..." >>/tmp/protonpass-cleanup.log

    # Use nohup with `SIGTERM` trap to ensure the following code executes
    # even after the parent process receives `SIGTERM` from `launchctl unload``
    nohup bash -c '
        trap "" SIGTERM;
        sleep 2
        rm -f "'"$PLIST_PATH"'" 2>>/tmp/protonpass-cleanup.log
        echo "$(date): Launch agent removed successfully" >> /tmp/protonpass-cleanup.log
    ' >/dev/null 2>&1 &

    echo "$(date): Cleanup process initiated" >>/tmp/protonpass-cleanup.log

    # Unload the agent
    launchctl bootout gui/$(id -u)/com.protonpass.cleanup 2>>/tmp/protonpass-cleanup.log
fi
