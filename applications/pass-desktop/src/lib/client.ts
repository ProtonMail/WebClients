import { clientBooted } from '@proton/pass/lib/client';
import type { AppState } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';

import { setupIpcHandler } from './ipc';

declare module './ipc' {
    interface IPCChannels {
        'client:setAppState': IPCChannel<[AppState], void>;
    }
}

const CLIENT_STATE: { app: AppState } = {
    app: {
        status: AppStatus.IDLE,
        authorized: false,
        booted: false,
    },
};

export const isClientBooted = () => clientBooted(CLIENT_STATE.app.status);

export const setupIpcHandlers = () => {
    setupIpcHandler('client:setAppState', (state) => {
        CLIENT_STATE.app = { ...state };
    });
};
