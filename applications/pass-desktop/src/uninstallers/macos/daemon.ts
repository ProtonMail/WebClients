import fs from 'fs';
import os from 'os';
import path from 'path';

import { isMac } from '../../utils/platform';

const { execSync } = require('child_process');

const homeDir = os.homedir();
const launchAgentDir = path.join(homeDir, 'Library/LaunchAgents');
const plistPath = path.join(launchAgentDir, 'com.protonpass.cleanup.plist');

const scriptContent = `#!/usr/bin/env bash

MAIN_APP="/Applications/Proton Pass.app"
BETA_APP="/Applications/Proton Pass Beta.app"
DATA_DIR="${homeDir}/Library/Application Support/Proton Pass"
LOGS_DIR="${homeDir}/Library/Logs/Proton Pass"

# Check if both main app and beta app are gone
if [ ! -d "$MAIN_APP" ] && [ ! -d "$BETA_APP" ]; then
  echo "Apps not found, cleaning up..." >> /tmp/protonpass-cleanup.log

  # Both apps are gone, clean up data
  rm -rf "$DATA_DIR" 2>> /tmp/protonpass-cleanup.log
  rm -rf "$LOGS_DIR" 2>> /tmp/protonpass-cleanup.log

  echo "Cleanup complete, unloading agent..." >> /tmp/protonpass-cleanup.log
  # Remove this launch agent too
  launchctl unload "${plistPath}" 2>/dev/null || true
fi`;

const getPlistContent = (scriptPath: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.protonpass.cleanup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${scriptPath}</string>
    </array>
    <key>StartInterval</key>
    <integer>30</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>`;

export const installDaemon = () => {
    if (!isMac || fs.existsSync(plistPath)) return;

    const scriptPath = path.join(homeDir, '.protonpass-cleanup.sh');

    if (!fs.existsSync(launchAgentDir)) fs.mkdirSync(launchAgentDir, { recursive: true });

    fs.writeFileSync(scriptPath, scriptContent);
    execSync(`chmod +x "${scriptPath}"`); // Make script executable
    fs.writeFileSync(plistPath, getPlistContent(scriptPath));

    try {
        execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`);
        execSync(`launchctl load "${plistPath}"`);
    } catch {}
};
