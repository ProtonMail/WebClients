import { exec } from 'child_process';
import { app } from 'electron';
import { chmodSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'os';
import path from 'path';

import { isMac } from '../../../utils/platform';

const homeDir = os.homedir();
const launchAgentDir = path.join(homeDir, 'Library/LaunchAgents');
const plistPath = path.join(launchAgentDir, 'com.protonpass.cleanup.plist');
const appData = app.getPath('appData');
const userData = app.getPath('userData');

const getPlistContent = (scriptPath: string) => {
    const logs = app.getPath('logs');

    return `<?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
            <plist version="1.0">
            <dict>
                <key>Label</key>
                <string>com.protonpass.cleanup</string>
                <key>ProgramArguments</key>
                <array>
                    <string>/bin/bash</string>
                    <string>${scriptPath}</string>
                    <string>${userData}</string>
                    <string>${logs}</string>
                </array>
                <key>StartInterval</key>
                <integer>30</integer>
                <key>RunAtLoad</key>
                <true/>
            </dict>
            </plist>`;
};

export const installDaemon = () => {
    try {
        const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
        if (!isMac || isDev) return;

        /** If the .plist file is found - then either the daemon is running
         * or the user manually unloaded it using `unload -w` */
        if (existsSync(plistPath)) return;

        const uninstallScriptPath = resolve(process.resourcesPath, 'cleanup.sh');
        const scriptPath = resolve(appData, 'proton-pass-cleanup.sh');

        copyFileSync(uninstallScriptPath, scriptPath);
        chmodSync(scriptPath, '755'); // Make it executable
        writeFileSync(plistPath, getPlistContent(scriptPath));

        exec(`launchctl bootout gui/$(id -u)/com.protonpass.cleanup 2>/dev/null || true`, () =>
            exec(`launchctl bootstrap gui/$(id -u) "${plistPath}"`)
        );
    } catch {}
};
