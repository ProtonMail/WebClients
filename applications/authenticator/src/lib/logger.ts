/* eslint-disable no-console */
import * as tauriLogger from '@tauri-apps/plugin-log';

const impl = tauriLogger;
const isDev = process.env.NODE_ENV !== 'production';

export default {
    debug: (message: string) => {
        if (isDev) console.debug(message);
        void impl.debug(message);
    },
    info: (message: string) => {
        if (isDev) console.info(message);
        void impl.info(message);
    },
    warn: (message: string) => {
        if (isDev) console.warn(message);
        void impl.warn(message);
    },
    error: (message: string) => {
        if (isDev) console.error(message);
        void impl.error(message);
    },
};
