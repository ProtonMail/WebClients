import { app } from 'electron';
import Logger from 'electron-log';
import { appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const squirrelLogger = Logger.scope('squirrel');

type Params = {
    logFile: string;
    scriptFile: string;
};

export const getLogger = ({ logFile, scriptFile }: Params) => {
    const logPath = resolve(app.getPath('temp'), logFile);
    const scriptPath = resolve(app.getPath('temp'), scriptFile);

    const logger = (...data: unknown[]) => {
        const prefix = existsSync(scriptPath) ? '\n' : '';
        const date = new Date().toISOString();
        const message = data
            .join(' ')
            .split('\n')
            .filter((line) => line.trim().length)
            .map((chunk) => `[${date}] ${chunk}`)
            .join('\n');

        appendFileSync(logPath, `${prefix}${message}`, 'utf8');
    };

    return { logger, logPath, scriptPath };
};
