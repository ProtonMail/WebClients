import { type ForkOptions, fork } from 'child_process';
import path from 'path';

import type { HrefLang, LocalizedPage } from './interface';

export const getPages = async (): Promise<{ hreflangs: HrefLang[]; pages: LocalizedPage[] }> => {
    const program = path.resolve(
        require.resolve('proton-account/package.json').replace(`${path.sep}package.json`, ''),
        'pages/pages.child.ts'
    );
    const parameters: any[] = [];
    const options: ForkOptions = {
        env: process.env,
        execArgv: [...process.execArgv, ...['--require', 'ts-node/register']],
    };
    return new Promise((resolve, reject) => {
        const child = fork(program, parameters, options);
        child.on('message', (message) => {
            resolve(message as any);
        });
        child.on('close', () => {
            reject();
        });
    });
};
