import noop from '@proton/utils/noop';

import { clipboard as clipboardNative } from '../../../native';
import { setupIpcHandler } from '../ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'clipboard:read': IPCChannel<[], string>;
        'clipboard:write': IPCChannel<[text: string], void>;
    }
}

export const setupIpcHandlers = () => {
    setupIpcHandler('clipboard:read', () => clipboardNative.read());
    setupIpcHandler('clipboard:write', (_event, text) => clipboardNative.writeText(text, true).catch(noop));
};
