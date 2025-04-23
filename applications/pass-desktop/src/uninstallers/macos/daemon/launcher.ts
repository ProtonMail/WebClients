import { exec } from 'child_process';
import { app } from 'electron';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'os';
import path from 'path';

import { isMac } from '../../../utils/platform';

const homeDir = os.homedir();
const launchAgentDir = path.join(homeDir, 'Library/LaunchAgents');
const plistPath = path.join(launchAgentDir, 'com.protonpass.cleanup.plist');

const getPlistContent = (scriptPath: string) => {
    const userData = app.getPath('userData');
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

        if (existsSync(plistPath)) {
            return exec('launchctl list | grep com.protonpass.cleanup', (error, stdout) => {
                if (error || !stdout.trim()) exec(`launchctl load "${plistPath}"`);
            });
        }

        const uninstallScriptPath = resolve(process.resourcesPath, 'cleanup.sh');
        const scriptPath = resolve(app.getPath('temp'), 'proton-pass-cleanup.sh');
        copyFileSync(uninstallScriptPath, scriptPath);
        writeFileSync(plistPath, getPlistContent(scriptPath));

        exec(`launchctl unload "${plistPath}" 2>/dev/null || true`);
        exec(`launchctl load "${plistPath}"`);
    } catch {}
};
