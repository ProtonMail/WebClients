import { type BrowserWindow, powerMonitor } from 'electron';
import debounce from 'lodash/debounce';

import type { MaybeNull } from '@proton/pass/types';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'system:wake': IPCChannel<[void], void>;
    }
}

export const system = (getWindow: () => MaybeNull<BrowserWindow>) => {
    const onWake = debounce(() => getWindow()?.webContents.send('system:wake'), 250);
    powerMonitor.on('resume', onWake);
    powerMonitor.on('unlock-screen', onWake);
};
